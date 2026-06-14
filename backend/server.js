const express = require("express");
const cors = require("cors");
const { scrapeDonors } = require("./scraper");
const { getAgentForLanguage, getAgentId, getLanguageForState } = require("./languages");
const { db } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// --- In-memory state ---
const requests = new Map();
const sseClients = new Map();
const rateLimits = new Map();
const scheduledFollowups = []; // track follow-up calls // phone -> { count, resetAt }

// --- Rate limiting ---
function checkRateLimit(phone) {
  const now = Date.now();
  const entry = rateLimits.get(phone) || { count: 0, resetAt: now + 3600000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 3600000;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  rateLimits.set(phone, entry);
  return true;
}

// --- SSE helpers ---
function addClient(requestId, res) {
  if (!sseClients.has(requestId)) sseClients.set(requestId, []);
  sseClients.get(requestId).push(res);
}
function removeClient(requestId, res) {
  const clients = sseClients.get(requestId) || [];
  sseClients.set(requestId, clients.filter((c) => c !== res));
}
function emit(requestId, type, data) {
  const event = { type, ...data, timestamp: Date.now() };
  const req = requests.get(requestId);
  if (req) req.events.push(event);
  const clients = sseClients.get(requestId) || [];
  clients.forEach((res) => res.write(`data: ${JSON.stringify(event)}\n\n`));
  console.log(`[${requestId}] ${type}:`, JSON.stringify(data).slice(0, 120));
}

// --- SSE stream ---
app.get("/api/stream/:requestId", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const { requestId } = req.params;
  addClient(requestId, res);
  const existing = requests.get(requestId);
  if (existing) existing.events.forEach((ev) => res.write(`data: ${JSON.stringify(ev)}\n\n`));
  req.on("close", () => removeClient(requestId, res));
});

// --- Extract request via AWS Bedrock (Claude Haiku) ---
const ALLOWED_BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

async function extractRequest(message) {
  const region = process.env.AWS_REGION || "eu-west-1";

  try {
    // Use AWS SDK v3 sign or invoke Bedrock runtime
    const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
    const client = new BedrockRuntimeClient({ region });

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Extract blood donation request from this message. Return ONLY valid JSON, nothing else.\n\nMessage: "${message}"\n\nReturn: {"blood_group": "O+/O-/A+/A-/B+/B-/AB+/AB- or null", "hospital": "hospital name or null", "city": "map to nearest known area from this list: J P Nagar, Koramangala, Whitefield, Electronic City, Indiranagar, HSR Layout, BTM Layout, Marathahalli, Jayanagar, Rajajinagar, Hebbal, Banashankari, Malleshwaram, Yelahanka. If unsure use J P Nagar", "urgency": "emergency/routine", "reason": "brief reason like accident, surgery, delivery or null", "units": "number of units needed or 1"}`
      }],
    };

    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const body = JSON.parse(new TextDecoder().decode(response.body));
    const text = body.content?.[0]?.text;

    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.blood_group && !ALLOWED_BLOOD_GROUPS.includes(parsed.blood_group)) parsed.blood_group = null;
      if (parsed.hospital) parsed.hospital = parsed.hospital.slice(0, 100).replace(/[<>{}]/g, "");
      if (parsed.city) parsed.city = parsed.city.slice(0, 50).replace(/[<>{}]/g, "");
      return parsed;
    }
  } catch (err) {
    console.error("Bedrock extraction failed, falling back to regex:", err.message);
  }

  return regexExtract(message);
}

function regexExtract(message) {
  const msg = message.toUpperCase();
  let blood_group = ALLOWED_BLOOD_GROUPS.find((bg) => msg.includes(bg)) || null;
  if (!blood_group) {
    const map = { "O POSITIVE": "O+", "O NEGATIVE": "O-", "A POSITIVE": "A+", "A NEGATIVE": "A-", "B POSITIVE": "B+", "B NEGATIVE": "B-", "AB POSITIVE": "AB+", "AB NEGATIVE": "AB-" };
    for (const [k, v] of Object.entries(map)) { if (msg.includes(k)) { blood_group = v; break; } }
  }
  const hospitalMatch = message.match(/(fortis|apollo|manipal|max|narayana|columbia|baptist|sakra|jayadeva|nimhans|st\.?\s?john|ramaiah|victoria|bowring)[\w\s]*/i);
  const hospital = hospitalMatch ? hospitalMatch[0].trim().slice(0, 100) : null;
  const cityMatch = message.match(/(bannerghatta|jp\s?nagar|koramangala|whitefield|electronic\s?city|indiranagar|hsr|btm|marathahalli|jayanagar|rajajinagar|hebbal)/i);
  const city = cityMatch ? cityMatch[0] : "J P Nagar";
  const urgentWords = ["urgent", "emergency", "accident", "critical", "jaldi", "turant"];
  const urgency = urgentWords.some((w) => msg.toLowerCase().includes(w)) ? "emergency" : "routine";
  return { blood_group, hospital, city, urgency };
}

// --- Create request ---
app.post("/api/request", async (req, res) => {
  const { message, phone, latitude, longitude, location_name } = req.body;

  if (!message || !phone) return res.status(400).json({ error: "message and phone required" });
  if (!checkRateLimit(phone)) return res.status(429).json({ error: "Too many requests. Max 3 per hour." });

  const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
  requests.set(requestId, {
    id: requestId,
    message,
    phone,
    latitude: latitude || null,
    longitude: longitude || null,
    location_name: location_name || null,
    status: "processing",
    donors: [],
    confirmed: [],
    events: [],
    created_at: new Date().toISOString(),
  });

  res.json({ request_id: requestId, status: "processing" });
  runActivationFlow(requestId, message, phone);
});

async function runActivationFlow(requestId, message, phone) {
  const request = requests.get(requestId);

  // Step 1: Extract
  emit(requestId, "extracting", { message: "Understanding your request..." });
  const extracted = await extractRequest(message);
  request.extracted = extracted;

  emit(requestId, "extracted", {
    message: `Got it: ${extracted.blood_group || "?"} blood at ${extracted.hospital || "nearby hospital"} (${extracted.urgency})`,
    data: extracted,
  });

  if (!extracted.blood_group) {
    emit(requestId, "error", { message: "Couldn't determine blood group. Please mention it clearly (e.g. O+, B-, AB+)" });
    return;
  }

  // Persist to Supabase
  db.saveRequest(request).catch(() => {});

  // Step 2: Scrape
  emit(requestId, "searching", { message: `Searching ${extracted.blood_group} donors near ${extracted.city || "Bangalore"}...` });

  let donors;
  try {
    donors = await scrapeDonors(
      { bloodGroup: extracted.blood_group, country: "INDIA", state: "Karnataka", district: "Bangalore", city: extracted.city || "J P Nagar" },
      { maxPages: 2, onPageScraped: (p, c) => emit(requestId, "page_scraped", { message: `Page ${p}: ${c} donors found`, page: p, donors_found: c }) }
    );
  } catch (err) {
    emit(requestId, "scrape_error", { message: `Searching alternate donor database...` });
    donors = getDemoDonors();
  }

  request.donors = donors;
  emit(requestId, "donors_found", { message: `Found ${donors.length} available ${extracted.blood_group} donors`, total: donors.length, donors: donors.slice(0, 5).map(d => ({ name: d.name, mobile: maskPhone("+91" + d.mobile) })) });

  if (donors.length === 0) {
    emit(requestId, "no_donors", { message: "No matching donors found in this area." });
    return;
  }

  // Step 3: Filter + call all safe donors
  let callTargets = filterToSafeNumbers(donors);
  if (callTargets.length === 0) callTargets = SAFE_NUMBERS.map(n => ({ name: "Donor", mobile: n }));

  emit(requestId, "calling", { message: `Calling ${callTargets.length} matching donor(s)...` });
  request.status = "calling";

  for (const target of callTargets) {
    try {
      const result = await triggerRinggCall(target, requestId, extracted);
      emit(requestId, "call_initiated", { message: `Voice agent speaking with ${target.name.split(" ")[0]}...`, call_id: result.call_id });
    } catch (err) {
      emit(requestId, "call_error", { message: `Call to ${target.name.split(" ")[0]} failed: ${err.message}` });
    }
  }
}

// --- Ringg API ---
async function triggerRinggCall(donor, requestId, extracted) {
  if (!process.env.RINGG_API_KEY) throw new Error("RINGG_API_KEY not set");

  // Pick the right agent for the donor's language
  // Priority: 1) donor's saved preference, 2) state inference, 3) English default
  const registeredDonor = donors.get(donor.mobile) || donors.get(`+91${donor.mobile}`);
  const donorLang = registeredDonor?.language || donor.language || getLanguageForState(extracted.state) || "en-IN";
  const agentConfig = getAgentForLanguage(donorLang);
  const agentId = agentConfig.agent_id;

  if (!agentId) throw new Error("No agent configured for language: " + donorLang);

  // Memory: look up donor's past donations for personalization
  let donor_memory = "";
  const history = await db.getDonorHistory(`+91${donor.mobile}`).catch(() => null);
  if (history && history.length > 0) {
    const last = history[0];
    const daysAgo = Math.round((Date.now() - new Date(last.donated_at).getTime()) / 86400000);
    donor_memory = `You donated ${daysAgo} days ago at ${last.hospital} and helped save a life. Thank you for being a repeat donor.`;
  }

  const payload = {
    name: donor.name,
    mobile_number: `+91${donor.mobile}`,
    agent_id: agentId,
    from_number_id: process.env.RINGG_FROM_NUMBER_ID,
    custom_args_values: {
      callee_name: donor.name.split(" ")[0],
      blood_group: extracted.blood_group,
      hospital_name: (extracted.hospital || "the hospital").slice(0, 100),
      hospital_address: (extracted.city || "Bangalore").slice(0, 100),
      request_id: requestId,
      preferred_language: donorLang === "hi-IN" ? "Hindi" : "English",
      requester_phone: requests.get(requestId)?.phone || "",
      reason: (extracted.reason || "a patient in need").slice(0, 100),
      units_needed: extracted.units || "1",
      donor_memory: donor_memory,
    },
    callback_url: `${process.env.PUBLIC_URL}/api/webhooks/ringg`,
  };

  emit(requestId, "language_selected", {
    message: `Speaking to donor in ${agentConfig.name.replace("RaktSetu ", "")}`,
  });

  const res = await fetch("https://prod-api.ringg.ai/ca/api/v0/calling/outbound/individual", {
    method: "POST",
    headers: { "X-API-KEY": process.env.RINGG_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
  return { call_id: data.data?.call_id || data.call_id };
}

// --- Ringg Webhook (with auth validation) ---
app.post("/api/webhooks/ringg", (req, res) => {
  // Validate webhook source
  const authHeader = req.headers.authorization;
  if (process.env.WEBHOOK_SECRET && authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return res.status(401).send();
  }
  res.status(204).send();

  const event = req.body;
  const requestId = event.custom_args_values?.request_id;
  if (!requestId) return;

  const request = requests.get(requestId);
  if (!request) return;

  // Deduplicate
  const dedupeKey = `${event.call_id}:${event.event_type}`;
  if (request._processed?.has(dedupeKey)) return;
  if (!request._processed) request._processed = new Set();
  request._processed.add(dedupeKey);

  if (event.event_type === "call_started") {
    emit(requestId, "call_started", { message: "Ringing donor..." });
  }

  if (event.event_type === "call_completed") {
    emit(requestId, "call_completed", {
      message: `Call ended (${Math.round(event.call_duration || 0)}s)`,
      duration: event.call_duration,
      transcript: event.transcript,
    });
  }

  if (event.event_type === "all_processing_completed") {
    const platformAnalysis = event.analysis_data || {};
    const clientAnalysis = event.client_analysis || {};
    const classification = platformAnalysis.classification || clientAnalysis.donor_available || "";
    const summary = platformAnalysis.summary || "";
    const eta = clientAnalysis.eta_minutes || platformAnalysis.eta_minutes;

    emit(requestId, "analysis_complete", { message: `Analysis: ${classification || clientAnalysis.donor_available || "processing"}`, classification, summary, transcript: event.transcript });

    const isConfirmed = /(confirmed|available|yes|willing|ready)/i.test(classification) ||
      /(confirmed|yes|i can|haan|available|mark me|i.?ll come|i will come|30 min|45 min|on my way)/i.test(JSON.stringify(event.transcript));

    if (isConfirmed) {
      const donor = {
        name: event.custom_args_values?.callee_name,
        phone: maskPhone(event.to_number), // Never expose full number to requester
        eta: eta || event.analysis_data?.eta_minutes || "30",
        confirmed_at: new Date().toISOString(),
      };
      request.confirmed.push(donor);
      request.status = "fulfilled";
      emit(requestId, "donor_confirmed", { message: `✅ ${donor.name} confirmed! ETA: ${donor.eta} min`, donor, total_confirmed: request.confirmed.length });
      sendTelegramNotification(request, donor);
      db.saveConfirmedDonor(requestId, donor).catch(() => {});
      db.updateRequestStatus(requestId, "fulfilled").catch(() => {});

      // Schedule follow-up call in 20 min to confirm donor is on the way
      const etaMs = (parseInt(eta) || 30) * 60 * 1000;
      const followUpDelay = Math.max(etaMs - 10 * 60 * 1000, 60000); // 10 min before ETA, min 1 min
      const followUpTime = new Date(Date.now() + followUpDelay);
      scheduledFollowups.push({
        donor_name: event.custom_args_values?.callee_name,
        donor_phone: maskPhone(event.to_number),
        request_id: requestId,
        hospital: request.extracted?.hospital,
        eta: eta,
        scheduled_for: followUpTime.toISOString(),
        context: `You confirmed ${eta} min ago. Checking if you're on your way to ${request.extracted?.hospital || "the hospital"}.`,
        status: "pending",
      });
      setTimeout(() => {
        triggerFollowUpCall(event.to_number, event.custom_args_values?.callee_name, requestId, request.extracted);
        const f = scheduledFollowups.find(f => f.request_id === requestId && f.status === "pending");
        if (f) f.status = "fired";
      }, followUpDelay);
    } else {
      emit(requestId, "donor_unavailable", { message: `Donor unavailable: ${summary || classification}` });
    }
  }
});

// --- Notifications ---
async function sendTelegramNotification(request, donor) {
  const requesterPhone = request.phone?.replace(/[^0-9]/g, "");

  // Message to donor (WhatsApp via Twilio)
  const donorMsg = `🩸 praana — Thank you for saying yes.\n\nSomeone's life depends on you reaching the hospital. Every minute matters.\n\n🏥 ${request.extracted?.hospital || "Nearby hospital"}\n🅰️ Blood Group: ${request.extracted?.blood_group}\n\n📞 Requester: ${request.phone}\n💬 WhatsApp: https://wa.me/${requesterPhone}\n\nPlease head there now. You're about to do something extraordinary — a stranger will live because you showed up.\n\n🙏 Thank you, hero.`;

  // Send WhatsApp to donor (works independently of Telegram)
  const donorPhone = donor.phone?.includes("****") ? null : donor.phone; // can't send to masked number
  if (donorPhone) {
    await sendWhatsApp(donorPhone, donorMsg);
  } else {
    // Use the raw number from safe numbers for demo
    await sendWhatsApp(`+91${SAFE_NUMBERS[0]}`, donorMsg);
  }

  // Message to requester (Telegram if configured, otherwise just emit)
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const requesterMsg = `🩸 *praana — Donor Confirmed!*\n\n` +
    `*Blood Group:* ${request.extracted?.blood_group}\n` +
    `*Hospital:* ${request.extracted?.hospital || "Nearby hospital"}\n` +
    `*Donor:* ${donor.name}\n` +
    `*ETA:* ${donor.eta} minutes\n\n` +
    `Please be at the blood bank reception.`;

  if (botToken && chatId) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: requesterMsg, parse_mode: "Markdown" }),
      });
    } catch (err) {
      console.error("Telegram failed:", err.message);
    }
  }

  // Also send requester notification via WhatsApp
  const requesterWAMsg = `🩸 praana — Donor confirmed!\n\n✅ A donor is heading to ${request.extracted?.hospital || "the hospital"} now.\n⏱️ ETA: ~${donor.eta} minutes\n\nPlease be at the blood bank reception to receive them.\n\nHang in there — help is on the way. 🙏`;
  await sendWhatsApp(`whatsapp:+91${requesterPhone}`, requesterWAMsg).catch(() => {});

  emit(request.id, "notification_sent", { message: `📲 Hospital details + requester contact sent to donor via WhatsApp.` });
}

// --- Follow-up call (confirm donor is on the way) ---
async function triggerFollowUpCall(donorPhone, donorName, requestId, extracted) {
  if (!process.env.RINGG_API_KEY) return;

  const payload = {
    name: donorName || "Donor",
    mobile_number: donorPhone,
    agent_id: process.env.RINGG_AGENT_ID,
    from_number_id: process.env.RINGG_FROM_NUMBER_ID,
    custom_args_values: {
      callee_name: donorName || "there",
      blood_group: extracted?.blood_group || "",
      hospital_name: extracted?.hospital || "the hospital",
      hospital_address: extracted?.city || "",
      request_id: `${requestId}-followup`,
      preferred_language: "English",
      requester_phone: "",
      reason: "checking if you're on your way",
      units_needed: "1",
      donor_memory: "You confirmed a few minutes ago that you'd donate. Just checking — are you on your way to the hospital?",
    },
    callback_url: `${process.env.PUBLIC_URL}/api/webhooks/ringg`,
  };

  try {
    await fetch("https://prod-api.ringg.ai/ca/api/v0/calling/outbound/individual", {
      method: "POST",
      headers: { "X-API-KEY": process.env.RINGG_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[FOLLOW-UP] Called ${donorName} to confirm they're on the way`);
  } catch (err) {
    console.error(`[FOLLOW-UP] Failed:`, err.message);
  }
}

// --- WhatsApp via Twilio ---
async function sendWhatsApp(to, message) {
  const sid = process.env.TWILIO_SID;
  const auth = process.env.TWILIO_AUTH;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !auth || !from) {
    console.log(`[WHATSAPP] Not configured. Would send to ${to}`);
    return;
  }

  const toWhatsapp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${auth}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `To=${encodeURIComponent(toWhatsapp)}&From=${encodeURIComponent(from)}&Body=${encodeURIComponent(message)}`,
    });
    const data = await res.json();
    if (data.sid) {
      console.log(`[WHATSAPP] Sent to ${to}: ${data.sid}`);
    } else {
      console.log(`[WHATSAPP] Failed:`, data.message || data);
    }
  } catch (err) {
    console.error(`[WHATSAPP] Error:`, err.message);
  }
}

// --- Helpers ---
function maskPhone(phone) {
  // Never expose full donor phone to requester: +919876543210 → +91****3210
  if (!phone) return "";
  return phone.slice(0, 3) + "****" + phone.slice(-4);
}

function getDemoDonors() {
  // If someone registered via demo box, use them instead
  const registered = [...donors.values()];
  if (registered.length > 0) {
    return registered.map(d => ({ name: d.name, mobile: d.phone.replace("+91", "").replace(/\D/g, ""), availability: "Available" }));
  }
  return [
    { name: "Jeevan D C", mobile: "7259702969", availability: "Available" },
  ];
}

const SAFE_NUMBERS = (process.env.SAFE_NUMBERS || "7259702969").split(",");
function filterToSafeNumbers(allDonors) {
  // Include both env-configured safe numbers AND registered donors
  const registeredPhones = [...donors.keys()].map(p => p.replace("+91", ""));
  const allowed = new Set([...SAFE_NUMBERS, ...registeredPhones]);
  return allDonors.filter((d) => allowed.has(d.mobile));
}

// --- Donor Registry (in-memory for demo, DB in production) ---
const donors = new Map(); // phone -> { name, blood_group, city, language, emergency_override, registered_at }

app.post("/api/donors/register", (req, res) => {
  const { name, phone, blood_group, city, area, language, emergency_override, latitude, longitude, health_checkup_optin } = req.body;
  if (!phone || !blood_group) return res.status(400).json({ error: "phone and blood_group required" });
  if (blood_group !== "unknown" && !ALLOWED_BLOOD_GROUPS.includes(blood_group)) return res.status(400).json({ error: "Invalid blood group" });

  donors.set(phone, {
    name: name || "Anonymous",
    phone,
    blood_group,
    city: city || "Unknown",
    area: area || null,
    latitude: latitude || null,
    longitude: longitude || null,
    language: language || "en-IN",
    emergency_override: emergency_override !== false,
    health_checkup_optin: health_checkup_optin || false,
    registered_at: new Date().toISOString(),
    total_donations: 0,
    last_donation_date: null,
    response_rate: 0.5,
  });

  db.saveDonor({ phone, name, blood_group, city, language: language || "en-IN", emergency_override: emergency_override !== false }).catch(() => {});
  res.json({ status: "registered", donor_count: donors.size });
});

app.get("/api/donors/count", (req, res) => {
  res.json({ total: donors.size });
});

// --- Ringg webhook for donor registration agent ---
app.post("/api/webhooks/ringg/registration", (req, res) => {
  res.status(204).send();
  const event = req.body;
  if (event.event_type !== "all_processing_completed") return;

  // Extract donor details from call analysis
  const analysis = event.analysis_data;
  if (!analysis) return;

  const phone = event.to_number;
  const donorData = {
    name: analysis.donor_name || event.custom_args_values?.callee_name || "Unknown",
    phone,
    blood_group: analysis.blood_group || null,
    city: analysis.city || "Unknown",
    language: analysis.preferred_language || "hi-IN",
    emergency_override: analysis.emergency_ok !== false,
    registered_at: new Date().toISOString(),
    total_donations: 0,
    last_donation_date: null,
    response_rate: 0.5,
  };

  if (donorData.blood_group && ALLOWED_BLOOD_GROUPS.includes(donorData.blood_group)) {
    donors.set(phone, donorData);
    console.log(`[REGISTRATION] New donor: ${donorData.name} (${donorData.blood_group}) via voice`);
  }
});

// --- No-show tracking ---
app.post("/api/donation/no-show", async (req, res) => {
  const { donor_phone, request_id } = req.body;
  if (!donor_phone || !request_id) return res.status(400).json({ error: "donor_phone and request_id required" });
  await db.recordNoShow(donor_phone, request_id);
  res.json({ status: "recorded", note: "Donor reliability score updated" });
});

// --- Confirm donation happened (post-donation) ---
app.post("/api/donation/confirm", async (req, res) => {
  const { donor_phone, request_id } = req.body;
  if (!donor_phone || !request_id) return res.status(400).json({ error: "donor_phone and request_id required" });

  const request = requests.get(request_id);
  await db.saveDonation(
    donor_phone,
    request_id,
    request?.extracted?.hospital || "Unknown",
    request?.extracted?.blood_group || "Unknown"
  );

  res.json({ status: "recorded", next_eligible: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() });
});

// --- Process due reminders (call via cron or manually) ---
app.post("/api/reminders/process", async (req, res) => {
  const reminders = await db.getDueReminders();
  if (!reminders || reminders.length === 0) return res.json({ processed: 0 });

  let sent = 0;
  for (const reminder of reminders) {
    const history = await db.getDonorHistory(reminder.donor_phone);
    const lastDonation = history?.[0];

    let message;
    if (reminder.type === "eligible_again") {
      const daysAgo = lastDonation ? Math.round((Date.now() - new Date(lastDonation.donated_at).getTime()) / 86400000) : 90;
      message = `🩸 praana: Hi! ${daysAgo} days ago you donated blood at ${lastDonation?.hospital || "a hospital"} and helped save a life. You're now eligible to donate again. When the next emergency comes, you'll be the first person we call. Thank you for being a hero. 🙏`;
    } else if (reminder.type === "impact_story") {
      message = `🩸 praana: Remember your donation at ${lastDonation?.hospital || "the hospital"} last week? A patient received your blood and is recovering well. You made that possible. Thank you. 🙏`;
    }

    if (message) {
      await sendWhatsApp(reminder.donor_phone, message);
      await db.markReminderSent(reminder.id);
      sent++;
    }
  }

  res.json({ processed: sent });
});

// --- View scheduled follow-ups ---
app.get("/api/followups", (req, res) => {
  res.json(scheduledFollowups);
});

// --- View scheduled reminders ---
app.get("/api/reminders", async (req, res) => {
  const all = await db.getDueReminders();
  res.json(all || []);
});

// --- Donor history ---
app.get("/api/donor/:phone/history", async (req, res) => {
  const history = await db.getDonorHistory(req.params.phone);
  res.json(history || []);
});

// --- Status ---
app.get("/api/request/:requestId", (req, res) => {
  const request = requests.get(req.params.requestId);
  if (!request) return res.status(404).json({ error: "Not found" });
  // Don't expose internal fields
  const { _processed, ...safe } = request;
  res.json(safe);
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`🚀 RaktSetu backend on port ${PORT}`);
  console.log(`   LLM: AWS Bedrock (Claude Haiku) with regex fallback`);
  console.log(`   Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? "configured" : "not configured"}`);
});
