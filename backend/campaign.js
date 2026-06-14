/**
 * Campaign module — for calling multiple donors simultaneously.
 * Use individual calls for demo. Use campaigns for "wow factor" if credits allow.
 */

const { getAgentId } = require("./languages");

const RINGG_BASE = "https://prod-api.ringg.ai/ca/api/v0";

async function runCampaign(donors, requestId, extracted, language) {
  const agentId = getAgentId(language || "en-IN");
  const csv = buildCSV(donors, extracted, requestId);

  // Step 1: Upload CSV
  const formData = new FormData();
  formData.append("variables_map", JSON.stringify({
    mobile_number: "Mobile Number",
    callee_name: "Name",
    blood_group: "Blood Group",
    hospital_name: "Hospital Name",
    hospital_address: "Hospital Address",
    request_id: "Request ID",
  }));
  formData.append("agent_id", agentId);
  formData.append("country_code", "+91");
  formData.append("campaign_name", `Emergency-${requestId}`);
  formData.append("campaign_start_time", formatNow());
  formData.append("campaign_end_time", formatEnd());
  formData.append("call_config", JSON.stringify({
    call_time: { call_start_time: "00:00", call_end_time: "23:59", timezone: "Asia/Kolkata" },
    call_retry_config: { retry_count: 1, retry_busy: 5, retry_not_picked: 10, retry_failed: 5 },
  }));
  formData.append("file", new Blob([csv], { type: "text/csv" }), "donors.csv");

  const uploadRes = await fetch(`${RINGG_BASE}/campaign/save`, {
    method: "POST",
    headers: { "X-API-KEY": process.env.RINGG_API_KEY },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Campaign upload failed");
  const listId = uploadData.list_id;

  // Step 2: Start campaign
  const startRes = await fetch(`${RINGG_BASE}/campaign/start`, {
    method: "POST",
    headers: { "X-API-KEY": process.env.RINGG_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: agentId,
      list_id: listId,
      from_numbers: [process.env.RINGG_FROM_NUMBER_ID],
      callback_url: `${process.env.PUBLIC_URL}/api/webhooks/ringg`,
    }),
  });

  if (!startRes.ok) {
    const err = await startRes.json();
    throw new Error(err.error?.message || "Campaign start failed");
  }

  return { list_id: listId, donor_count: donors.length };
}

async function terminateCampaign(listId) {
  await fetch(`${RINGG_BASE}/campaign/terminate`, {
    method: "PATCH",
    headers: { "X-API-KEY": process.env.RINGG_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id: listId }),
  });
}

function buildCSV(donors, extracted, requestId) {
  const header = "Mobile Number,Name,Blood Group,Hospital Name,Hospital Address,Request ID";
  const rows = donors.map((d) =>
    `+91${d.mobile},${d.name},${extracted.blood_group},${(extracted.hospital || "Hospital").replace(/,/g, " ")},${(extracted.city || "City").replace(/,/g, " ")},${requestId}`
  );
  return [header, ...rows].join("\n");
}

function formatNow() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatEnd() {
  const d = new Date(Date.now() + 3600000); // +1 hour
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

module.exports = { runCampaign, terminateCampaign };
