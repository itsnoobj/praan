/**
 * Supabase persistence layer.
 * 
 * Setup:
 * 1. Create project at supabase.com
 * 2. Run the SQL below in SQL Editor
 * 3. Set SUPABASE_URL and SUPABASE_KEY in Railway env vars
 * 
 * SQL to run in Supabase:
 * 
 * create table requests (
 *   id text primary key,
 *   message text,
 *   phone text,
 *   blood_group text,
 *   hospital text,
 *   city text,
 *   urgency text,
 *   reason text,
 *   units int default 1,
 *   status text default 'processing',
 *   created_at timestamptz default now()
 * );
 * 
 * create table confirmed_donors (
 *   id uuid primary key default gen_random_uuid(),
 *   request_id text references requests(id),
 *   name text,
 *   phone text,
 *   eta int,
 *   confirmed_at timestamptz default now()
 * );
 * 
 * create table donors (
 *   phone text primary key,
 *   name text,
 *   blood_group text,
 *   city text,
 *   language text default 'en-IN',
 *   emergency_override boolean default true,
 *   registered_at timestamptz default now()
 * );
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function headers() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
}

async function query(table, method, body, filter) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  const url = `${SUPABASE_URL}/rest/v1/${table}${filter || ""}`;
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === "GET") return res.json();
  return res.ok;
}

const db = {
  async saveRequest(req) {
    return query("requests", "POST", {
      id: req.id,
      message: req.message,
      phone: req.phone,
      blood_group: req.extracted?.blood_group,
      hospital: req.extracted?.hospital,
      city: req.extracted?.city,
      urgency: req.extracted?.urgency,
      reason: req.extracted?.reason,
      units: req.extracted?.units || 1,
      status: req.status,
    });
  },

  async updateRequestStatus(id, status) {
    return query("requests", "PATCH", { status }, `?id=eq.${id}`);
  },

  async saveConfirmedDonor(requestId, donor) {
    return query("confirmed_donors", "POST", {
      request_id: requestId,
      name: donor.name,
      phone: donor.phone,
      eta: donor.eta,
    });
  },

  async saveDonor(donor) {
    return query("donors", "POST", {
      phone: donor.phone,
      name: donor.name,
      blood_group: donor.blood_group,
      city: donor.city,
      language: donor.language || "en-IN",
      emergency_override: donor.emergency_override !== false,
    });
  },

  async saveDonation(donorPhone, requestId, hospital, bloodGroup) {
    // Record the donation
    await query("donation_history", "POST", {
      donor_phone: donorPhone,
      request_id: requestId,
      hospital,
      blood_group: bloodGroup,
      impact_note: null, // filled later when we know who was helped
    });

    // Schedule a reminder for 90 days later (next eligible date)
    const reminderDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    await query("reminders", "POST", {
      donor_phone: donorPhone,
      type: "eligible_again",
      scheduled_for: reminderDate,
      message: null, // generated at send time with memory context
      sent: false,
    });

    // Schedule a thank-you + impact story at 7 days
    const impactDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await query("reminders", "POST", {
      donor_phone: donorPhone,
      type: "impact_story",
      scheduled_for: impactDate,
      message: null,
      sent: false,
    });
  },

  async getDonorHistory(phone) {
    return query("donation_history", "GET", null, `?donor_phone=eq.${encodeURIComponent(phone)}&order=donated_at.desc`);
  },

  async getDueReminders() {
    const now = new Date().toISOString();
    return query("reminders", "GET", null, `?sent=eq.false&scheduled_for=lte.${now}&limit=50`);
  },

  async markReminderSent(id) {
    return query("reminders", "PATCH", { sent: true, sent_at: new Date().toISOString() }, `?id=eq.${id}`);
  },

  async getRequests() {
    return query("requests", "GET", null, "?order=created_at.desc&limit=20");
  },

  async recordNoShow(donorPhone, requestId) {
    // Update donor reliability score
    await query("donation_history", "POST", {
      donor_phone: donorPhone,
      request_id: requestId,
      hospital: "NO_SHOW",
      blood_group: null,
      impact_note: "no_show",
    });
  },
};

module.exports = { db };
