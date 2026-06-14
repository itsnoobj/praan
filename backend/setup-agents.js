/**
 * Setup script: Creates one Ringg AI agent per supported language.
 * Run once at setup. Stores agent IDs to set in Railway env vars.
 *
 * Usage: RINGG_API_KEY=xxx node setup-agents.js
 */

const RINGG_BASE = "https://prod-api.ringg.ai/ca/api/v0";
const API_KEY = process.env.RINGG_API_KEY;

const COMMON_CONFIG = {
  agent_type: "outbound",
  introduction_and_objective: `You are a blood donation coordinator for RaktSetu, an emergency blood donor activation network. You are calling registered voluntary blood donors during a medical emergency. Your single job: confirm if this donor can donate blood at the specified hospital within the next 2 hours.`,
  task: `1. Confirm the donor is available to donate blood today.\n2. Verify they haven't donated in the last 90 days.\n3. Confirm they can reach the hospital within 2 hours.\n4. Capture estimated time of arrival in minutes.\n5. If yes — thank them, confirm hospital, end.\n6. If no — thank them politely, end.`,
  response_guidelines: `- Keep the call under 60 seconds.\n- Be calm, respectful, never pressure.\n- Mirror the donor's language.\n- If donor asks questions, answer briefly.\n- NEVER ask for OTP, bank details, Aadhaar.\n- NEVER pressure or guilt-trip.\n- NEVER continue past 90 seconds.\n- NEVER share patient identity.`,
  custom_variables: ["callee_name", "mobile_number", "blood_group", "hospital_name", "hospital_address", "request_id"],
};

const AGENTS = [
  {
    agent_name: "RaktSetu Hindi",
    primary_language: "hi-IN",
    secondary_language: "en-IN",
    intro_message: "Namaste @{{callee_name}} ji, main RaktSetu se bol raha hoon. @{{hospital_name}} mein @{{blood_group}} blood ki emergency zaroorat hai. Kya aap agle 2 ghante mein donate kar sakte hain?",
    env_key: "RINGG_AGENT_ID_HINDI",
  },
  {
    agent_name: "RaktSetu English",
    primary_language: "en-IN",
    secondary_language: "hi-IN",
    intro_message: "Hi @{{callee_name}}, this is RaktSetu. @{{hospital_name}} urgently needs @{{blood_group}} blood. Can you donate within the next 2 hours?",
    env_key: "RINGG_AGENT_ID_ENGLISH",
  },
  {
    agent_name: "RaktSetu Tamil",
    primary_language: "ta-IN",
    secondary_language: "en-IN",
    intro_message: "Vanakkam @{{callee_name}}, naan RaktSetu call pannugireen. @{{hospital_name}} la @{{blood_group}} ratham urgent-aa thevai. 2 mani neram la donate panna mudiyuma?",
    env_key: "RINGG_AGENT_ID_TAMIL",
  },
  {
    agent_name: "RaktSetu Telugu",
    primary_language: "te-IN",
    secondary_language: "en-IN",
    intro_message: "Namaskaram @{{callee_name}} garu, RaktSetu nundi call. @{{hospital_name}} lo @{{blood_group}} blood emergency ga kavali. 2 hours lo donate cheyagalara?",
    env_key: "RINGG_AGENT_ID_TELUGU",
  },
  {
    agent_name: "RaktSetu Kannada",
    primary_language: "kn-IN",
    secondary_language: "en-IN",
    intro_message: "Namaskara @{{callee_name}}, RaktSetu inda call. @{{hospital_name}} alli @{{blood_group}} rakta urgent aagi beku. 2 ghante olage donate maadoke aagutta?",
    env_key: "RINGG_AGENT_ID_KANNADA",
  },
  {
    agent_name: "RaktSetu Bengali",
    primary_language: "bn-IN",
    secondary_language: "en-IN",
    intro_message: "Nomoshkar @{{callee_name}}, RaktSetu theke bolchi. @{{hospital_name}} e @{{blood_group}} rokto jomoti dorkar. 2 ghontar modhye donate korte parben?",
    env_key: "RINGG_AGENT_ID_BENGALI",
  },
  {
    agent_name: "RaktSetu Marathi",
    primary_language: "mr-IN",
    secondary_language: "en-IN",
    intro_message: "Namaskar @{{callee_name}}, RaktSetu madhun call. @{{hospital_name}} madhe @{{blood_group}} blood chi tatkal garaj aahe. 2 taasaat donate karu shakta ka?",
    env_key: "RINGG_AGENT_ID_MARATHI",
  },
];

async function getVoiceForLanguage(language) {
  const res = await fetch(`${RINGG_BASE}/agent/voices?language=${language}`, {
    headers: { "X-API-KEY": API_KEY },
  });
  const data = await res.json();
  // Pick first available voice
  return data.data?.[0]?.id || data[0]?.id;
}

async function createAgent(config) {
  const voiceId = await getVoiceForLanguage(config.primary_language);
  if (!voiceId) {
    console.log(`  ⚠️  No voice for ${config.primary_language}, skipping ${config.agent_name}`);
    return null;
  }

  const payload = {
    ...COMMON_CONFIG,
    agent_name: config.agent_name,
    primary_language: config.primary_language,
    secondary_language: config.secondary_language,
    intro_message: config.intro_message,
    voice_id: voiceId,
  };

  const res = await fetch(`${RINGG_BASE}/public/agent`, {
    method: "POST",
    headers: { "X-API-KEY": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (data.success) {
    return data.data.id;
  } else {
    console.log(`  ❌ Failed: ${data.error?.message || JSON.stringify(data)}`);
    return null;
  }
}

async function main() {
  if (!API_KEY) {
    console.error("Set RINGG_API_KEY env var");
    process.exit(1);
  }

  console.log("🔧 Creating RaktSetu agents for all languages...\n");

  const envVars = [];

  for (const agent of AGENTS) {
    process.stdout.write(`  Creating ${agent.agent_name}...`);
    const agentId = await createAgent(agent);
    if (agentId) {
      console.log(` ✅ ${agentId}`);
      envVars.push(`${agent.env_key}=${agentId}`);
    }
  }

  console.log("\n\n📋 Set these in Railway env vars:\n");
  console.log(envVars.join("\n"));
  console.log("\n\nOr run:");
  console.log(`railway variables set ${envVars.join(" ")}`);
}

main().catch(console.error);
