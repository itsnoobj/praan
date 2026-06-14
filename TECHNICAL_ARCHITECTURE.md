# Blood Donor Activation Network — Technical Architecture

## System Overview

A voice-AI emergency blood donor matching platform built on Ringg AI APIs. The system receives urgent blood requests, activates matching donors via parallel outbound voice calls, and relays confirmed donors back to the requester in real-time.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST INTAKE LAYER                                │
├──────────────┬──────────────┬──────────────────┬───────────────────────────┤
│  Web App     │  WhatsApp    │  Hospital API    │  Missed Call (IVR)        │
│  (React)     │  (Twilio)    │  (REST webhook)  │  (Ringg Inbound Agent)    │
└──────┬───────┴──────┬───────┴────────┬─────────┴──────────┬────────────────┘
       │              │                │                    │
       ▼              ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API (Node.js / FastAPI)                       │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Request     │  │  Donor       │  │  Matching    │  │  Campaign     │  │
│  │  Service     │  │  Registry    │  │  Engine      │  │  Orchestrator │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RINGG AI LAYER                                       │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────────────┐  │
│  │  Donor Activation│  │  Post-Donation   │  │  Donor Registration       │  │
│  │  Agent           │  │  Follow-up Agent │  │  Agent (Inbound)          │  │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬───────────────┘  │
│           │                    │                         │                   │
│  ┌────────▼────────────────────▼─────────────────────────▼───────────────┐  │
│  │  Campaign API  │  Individual Call API  │  Webhooks (callback_url)     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                           │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  PostgreSQL   │  │  Redis       │  │  S3          │  │  Analytics    │  │
│  │  (Donors,     │  │  (Real-time  │  │  (Recordings │  │  (Ringg +     │  │
│  │   Requests)   │  │   state)     │  │   / CSVs)    │  │   Custom)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Flows

### Flow 1: Emergency Donor Activation (Primary)

```
1. Request comes in (web/WhatsApp/API)
   → blood_group, units_needed, hospital_location, urgency_level

2. Matching Engine queries donor registry
   → Filter: blood_group match + within 10km radius + last_donated > 90 days ago
   → Sort by: response_rate (historical), distance, recency
   → Select top 50-80 donors

3. Campaign Orchestrator generates CSV + triggers Ringg Campaign API
   → POST /campaign/save (upload donor list)
   → POST /campaign/start (fire calls)

4. Ringg Donor Activation Agent calls each donor
   → Speaks in donor's preferred language
   → Confirms: "Can you donate [blood_group] at [hospital] within 2 hours?"
   → Captures: yes/no/maybe + ETA

5. Webhook receives call_completed events in real-time
   → classification: "confirmed" / "unavailable" / "no_answer"
   → Updates request dashboard live

6. Once 2-3 donors confirmed → Terminate remaining calls
   → PATCH /campaign/terminate

7. Notify requester (SMS/WhatsApp/Push) with confirmed donor details
```

### Flow 2: Donor Registration (Inbound)

```
1. Potential donor gives missed call to registration number
   → Ringg Inbound Agent calls back

2. Agent collects: name, blood_group, city/pincode, preferred language, consent

3. Webhook fires with custom_args extracted from conversation
   → Backend stores donor in registry

4. Confirmation SMS sent with donor ID
```

### Flow 3: Post-Donation Follow-up (Monetization)

```
1. 48 hours after successful donation, system triggers individual call
   → POST /calling/outbound/individual

2. Post-Donation Agent:
   → Shares: "Your donation helped [patient_info]. Thank you!"
   → Offers: "Would you like a free health report from [diagnostic_partner]?"
   → If yes → captures slot preference → books via partner API

3. Webhook logs response → triggers diagnostic center integration
```

---

## Ringg AI Agents Configuration

### Agent 1: Donor Activation Agent (Outbound)

```json
{
  "agent_name": "Blood Donor Activation Agent",
  "agent_type": "outbound",
  "primary_language": "hi-IN",
  "secondary_language": "en-IN",
  "introduction_and_objective": "You are a blood donation coordinator calling registered voluntary blood donors during medical emergencies. Your goal is to confirm if the donor can donate blood at a specific hospital within the next 2 hours.",
  "task": "Ask the donor if they are available to donate blood today. Confirm their blood group, check if they've donated in the last 90 days, confirm they can reach the hospital within 2 hours, and get a clear yes or no.",
  "response_guidelines": "Be respectful and brief — this is an emergency. State the need clearly in first 10 seconds. If donor says no, thank them and end. Do not pressure. If donor says yes, confirm ETA and hospital name. Keep call under 60 seconds.",
  "intro_message": "Namaste @{{callee_name}}, main RaktSetu se bol raha hoon. Ek emergency blood request aayi hai — @{{hospital_name}} mein @{{blood_group}} blood ki zaroorat hai. Kya aap agle 2 ghante mein donate kar sakte hain?",
  "custom_variables": ["callee_name", "mobile_number", "blood_group", "hospital_name", "hospital_address", "request_id"]
}
```

**Client Analysis Config (for classification):**
```json
{
  "analysis_prompts": {
    "donor_available": "Is the donor confirmed available to donate? (yes/no/maybe)",
    "eta_minutes": "Estimated time to reach hospital in minutes",
    "reason_unavailable": "If unavailable, what reason did they give?",
    "last_donation_recent": "Did the donor mention donating recently (within 90 days)?"
  }
}
```

### Agent 2: Donor Registration Agent (Inbound)

```json
{
  "agent_name": "Blood Donor Registration Agent",
  "agent_type": "inbound",
  "primary_language": "en-IN",
  "secondary_language": "hi-IN",
  "introduction_and_objective": "You are a friendly registration assistant for RaktSetu voluntary blood donor network. You help new donors register by collecting basic information.",
  "task": "Collect donor's full name, blood group (if known), city or pincode, age, and preferred language for future calls. Confirm all details before ending.",
  "response_guidelines": "Be warm and encouraging. Explain this is voluntary and they can opt out anytime. If they don't know blood group, that's fine — mark as 'unknown'. Keep registration under 90 seconds.",
  "intro_message": "Hello! Thank you for wanting to become a voluntary blood donor with RaktSetu. I'll just need a few quick details to register you. This will take less than 2 minutes."
}
```

### Agent 3: Post-Donation Follow-up Agent (Outbound)

```json
{
  "agent_name": "Post Donation Follow-up Agent",
  "agent_type": "outbound",
  "primary_language": "en-IN",
  "secondary_language": "hi-IN",
  "introduction_and_objective": "You call blood donors 48 hours after their donation to thank them, share impact, and offer a free health checkup from a partner diagnostic center.",
  "task": "Thank the donor for their recent donation. Share that their blood helped a patient. Ask if they'd like a free health mini-report from our partner lab. If yes, ask preferred date and nearby area for the center.",
  "response_guidelines": "Be grateful and warm. Do not be pushy about the health checkup — it's a genuine offer. If they decline, thank them and remind them they can donate again after 90 days.",
  "intro_message": "Hi @{{callee_name}}, this is RaktSetu. I'm calling to thank you for donating blood on @{{donation_date}}. Your donation reached a patient at @{{hospital_name}}. We'd also like to offer you a free health mini-checkup as a thank you — would you be interested?",
  "custom_variables": ["callee_name", "mobile_number", "donation_date", "hospital_name", "diagnostic_partner"]
}
```

---

## API Integration Details

### Base Configuration

```
Base URL: https://prod-api.ringg.ai/ca/api/v0
Auth: X-API-KEY header
Phone format: E.164 (+919876543210)
```

### Emergency Activation — Campaign API Usage

```javascript
// Step 1: Generate CSV from matching donors
function generateDonorCSV(donors, request) {
  const headers = "Mobile Number,Name,Blood Group,Hospital Name,Hospital Address,Request ID";
  const rows = donors.map(d =>
    `${d.phone},${d.name},${request.blood_group},${request.hospital_name},${request.hospital_address},${request.id}`
  );
  return [headers, ...rows].join("\n");
}

// Step 2: Upload campaign
const formData = new FormData();
formData.append("variables_map", JSON.stringify({
  mobile_number: "Mobile Number",
  callee_name: "Name",
  blood_group: "Blood Group",
  hospital_name: "Hospital Name",
  hospital_address: "Hospital Address",
  request_id: "Request ID"
}));
formData.append("agent_id", DONOR_ACTIVATION_AGENT_ID);
formData.append("country_code", "+91");
formData.append("campaign_name", `Emergency-${request.id}-${request.blood_group}`);
formData.append("call_config", JSON.stringify({
  call_time: {
    call_start_time: "00:00",  // emergencies are 24/7
    call_end_time: "23:59",
    timezone: "Asia/Kolkata"
  },
  call_retry_config: {
    retry_count: 1,
    retry_busy: 5,       // retry quickly — emergency
    retry_not_picked: 10,
    retry_failed: 5
  }
}));
formData.append("file", csvBuffer);

const campaign = await fetch(`${BASE_URL}/campaign/save`, {
  method: "POST",
  headers: { "X-API-KEY": API_KEY },
  body: formData
});
const { list_id } = await campaign.json();

// Step 3: Start campaign
await fetch(`${BASE_URL}/campaign/start`, {
  method: "POST",
  headers: { "X-API-KEY": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    agent_id: DONOR_ACTIVATION_AGENT_ID,
    list_id,
    from_numbers: [FROM_NUMBER_ID],
    callback_url: `${OUR_API}/webhooks/ringg/activation`
  })
});
```

### Webhook Handler — Real-time Donor Confirmation

```javascript
app.post("/webhooks/ringg/activation", async (req, res) => {
  res.status(204).send(); // respond immediately

  const event = req.body;
  const dedupeKey = `${event.call_id}:${event.event_type}`;

  if (event.event_type === "all_processing_completed") {
    const requestId = event.custom_args_values?.request_id;
    const classification = event.analysis_data?.classification;
    const donorPhone = event.to_number;

    if (classification === "donor_confirmed") {
      // Update request with confirmed donor
      await db.requests.addConfirmedDonor(requestId, {
        phone: donorPhone,
        name: event.custom_args_values.callee_name,
        eta: event.analysis_data?.eta_minutes,
        call_id: event.call_id
      });

      // Check if we have enough donors
      const request = await db.requests.get(requestId);
      if (request.confirmed_donors.length >= request.units_needed) {
        // Terminate remaining calls
        await terminateCampaign(request.campaign_list_id);
        // Notify requester
        await notifyRequester(request);
      }
    }

    // Update donor registry with response data
    await db.donors.updateResponseHistory(donorPhone, {
      responded: event.status === "completed",
      available: classification === "donor_confirmed",
      timestamp: new Date()
    });
  }
});
```

### Terminating Campaign After Enough Donors Found

```javascript
async function terminateCampaign(campaignId) {
  await fetch(`${BASE_URL}/campaign/terminate`, {
    method: "PATCH",
    headers: { "X-API-KEY": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ campaign_id: campaignId })
  });
}
```

---

## Database Schema (PostgreSQL)

```sql
-- Donor Registry
CREATE TABLE donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,        -- E.164 format
  name VARCHAR(100) NOT NULL,
  blood_group VARCHAR(5) NOT NULL,          -- A+, B-, O+, AB+ etc
  city VARCHAR(50),
  pincode VARCHAR(6),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  preferred_language VARCHAR(5) DEFAULT 'hi-IN',
  last_donation_date DATE,
  total_donations INT DEFAULT 0,
  response_rate DECIMAL(3, 2) DEFAULT 0.5,  -- historical answer rate
  is_active BOOLEAN DEFAULT true,
  registered_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50)                        -- 'self', 'ngo_import', 'college_drive', 'referral'
);

CREATE INDEX idx_donors_blood_group ON donors(blood_group);
CREATE INDEX idx_donors_location ON donors(lat, lng);
CREATE INDEX idx_donors_active ON donors(is_active, blood_group);

-- Blood Requests
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_group VARCHAR(5) NOT NULL,
  units_needed INT DEFAULT 1,
  hospital_name VARCHAR(200),
  hospital_address VARCHAR(500),
  hospital_lat DECIMAL(10, 8),
  hospital_lng DECIMAL(11, 8),
  urgency VARCHAR(20) DEFAULT 'emergency',  -- emergency, scheduled, routine
  requester_phone VARCHAR(15),
  requester_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',     -- pending, calling, fulfilled, expired
  campaign_list_id VARCHAR(100),            -- Ringg campaign ID
  created_at TIMESTAMP DEFAULT NOW(),
  fulfilled_at TIMESTAMP,
  payment_status VARCHAR(20) DEFAULT 'pending'
);

-- Confirmed Donors per Request
CREATE TABLE request_donors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id),
  donor_id UUID REFERENCES donors(id),
  call_id VARCHAR(100),                     -- Ringg call_id
  status VARCHAR(20) DEFAULT 'confirmed',   -- confirmed, arrived, donated, no_show
  eta_minutes INT,
  confirmed_at TIMESTAMP DEFAULT NOW()
);

-- Call History (mirror of Ringg webhook data)
CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id VARCHAR(100) UNIQUE NOT NULL,     -- Ringg call_id
  request_id UUID REFERENCES requests(id),
  donor_phone VARCHAR(15),
  event_type VARCHAR(50),
  status VARCHAR(20),
  classification VARCHAR(50),
  duration_seconds DECIMAL(8, 2),
  transcript JSONB,
  analysis_data JSONB,
  cost DECIMAL(8, 4),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite | Quick dashboard for hackathon |
| Backend API | Node.js (Express) or Python (FastAPI) | Fast to build, good Ringg SDK patterns |
| Database | PostgreSQL (Supabase) | Geospatial queries (PostGIS), free tier |
| Cache/Realtime | Redis (Upstash) | Track live request state, pub/sub for dashboard updates |
| Voice AI | Ringg AI APIs | Core platform — campaigns, agents, webhooks |
| Notifications | Twilio (SMS) / WhatsApp Business API | Notify requesters when donors confirmed |
| Hosting | Railway / Render / Vercel | Quick deploy, free tier for hackathon |
| File Storage | S3 / Supabase Storage | Campaign CSVs, recordings |

---

## Hackathon Demo Flow (5-minute pitch)

```
DEMO SEQUENCE:

[0:00] Show the problem (30s)
  → Family panicking, posting on WhatsApp, calling random numbers

[0:30] Hospital/family submits request on web dashboard
  → Enters: O+ blood, 2 units, Fortis Bangalore, emergency

[1:00] System matches 30 donors, fires Ringg campaign
  → Show live dashboard: "Calling 30 donors..."
  → Show Ringg campaign API call in logs

[1:30] LIVE CALL plays (pre-recorded or live demo)
  → Agent in Hindi: "Namaste Rahul ji, RaktSetu se bol raha hoon..."
  → Donor confirms availability

[2:30] Webhook fires → Dashboard updates in real-time
  → "3 donors confirmed! Avg ETA: 45 minutes"
  → Campaign auto-terminated (remaining calls stopped)

[3:00] Requester gets SMS/WhatsApp notification
  → "3 O+ donors confirmed for Fortis Bangalore. First arriving in 30 min."

[3:30] Show the business model (1 slide)
  → Multi-sided revenue: activation fee + diagnostic partnerships + insurance

[4:00] Show post-donation follow-up call (the flywheel)
  → Agent thanks donor, offers health checkup
  → "This is how we retain donors AND monetize"

[4:30] Scale metrics + ask
  → "500 donors in Bangalore pilot, 80% match rate, <90 min avg time"
```

---

## Webhook Event Subscriptions

Configure on each agent via `PATCH /agent/v1`:

```json
{
  "operation": "edit_event_subscriptions",
  "agent_id": "<donor-activation-agent-id>",
  "event_subscriptions": [
    {
      "event_type": ["call_started", "call_completed", "all_processing_completed"],
      "callback_url": "https://api.raktsetu.in/webhooks/ringg/activation",
      "headers": {
        "Authorization": "Bearer <webhook-secret>",
        "Content-Type": "application/json"
      },
      "method_type": "POST"
    }
  ]
}
```

**Why subscribe to multiple events:**
- `call_started` → update dashboard "calling X donors..."
- `call_completed` → quick status (answered/no-answer/busy) before analysis
- `all_processing_completed` → full classification + transcript for decision-making

---

## Matching Engine Logic

```python
def find_matching_donors(request):
    """
    Priority-ranked donor selection for emergency activation.
    """
    donors = db.query("""
        SELECT *, 
          ST_Distance(
            ST_MakePoint(lng, lat)::geography,
            ST_MakePoint(:hosp_lng, :hosp_lat)::geography
          ) / 1000 AS distance_km
        FROM donors
        WHERE blood_group = :blood_group
          AND is_active = true
          AND (last_donation_date IS NULL OR last_donation_date < NOW() - INTERVAL '90 days')
          AND ST_DWithin(
            ST_MakePoint(lng, lat)::geography,
            ST_MakePoint(:hosp_lng, :hosp_lat)::geography,
            15000  -- 15km radius
          )
        ORDER BY
          response_rate DESC,          -- donors who pick up more often
          distance_km ASC,             -- closer donors first
          last_donation_date ASC       -- haven't donated in a while (more willing)
        LIMIT 80
    """, {
        "blood_group": request.blood_group,
        "hosp_lat": request.hospital_lat,
        "hosp_lng": request.hospital_lng
    })
    
    return donors
```

---

## Scaling Considerations

| Concern | Solution |
|---|---|
| 10K+ donors in registry | Ringg handles 10K+ concurrent calls; use large campaign API (5K+ CSV) |
| Multi-city expansion | Partition donors by city; campaign per city per request |
| Language routing | Set `primary_language` on agent per region; or use single multilingual agent |
| Donor fatigue (too many calls) | Rate-limit: max 2 activation calls per donor per week |
| False confirmations | Track no-show rate; reduce response_rate score; deprioritize |
| Cost control | Terminate campaign as soon as N donors confirmed; don't call all 80 |

---

## Security & Compliance

- **Consent**: Donors explicitly opt-in during registration. Maintain consent timestamp.
- **Data minimization**: Only pass necessary variables to Ringg (`custom_args_values`).
- **Recording**: Inform donors calls are recorded (in intro_message). Store recordings max 30 days.
- **TRAI DND**: Check DND registry before calling. Ringg numbers should be whitelisted/registered.
- **Blood legality**: Platform facilitates voluntary donation coordination. No blood is sold. Compliant with Drugs & Cosmetics Act, 1940 and NACO guidelines.
- **API key security**: Keys in server-side env only. Rotate on team changes.

---

## MVP Scope (Hackathon Build)

| Component | Build | Skip (post-hackathon) |
|---|---|---|
| Request intake (web form) | ✅ | |
| Donor registry (seeded with test data) | ✅ | |
| Matching engine (blood group + city filter) | ✅ | Full PostGIS geo-ranking |
| Ringg campaign trigger | ✅ | |
| Webhook handler + live dashboard | ✅ | |
| Campaign termination on fulfillment | ✅ | |
| Donor registration (inbound agent) | ✅ | |
| Post-donation follow-up | ✅ (1 call demo) | Full automation |
| Payment integration | | ✅ |
| SMS/WhatsApp notifications | | ✅ (show mock) |
| Analytics dashboard | | ✅ |
| Multi-city support | | ✅ |
