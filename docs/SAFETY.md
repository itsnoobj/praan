# SAFETY & GUARDRAILS — RaktSetu

## Core Principle

We handle life-critical data (health info, phone numbers, location) of vulnerable people (donors and patients in emergencies). One breach of trust kills the product.

---

## Things We NEVER Do

### 1. Donor Abuse
- ❌ NEVER sell, share, or expose the donor list to any third party
- ❌ NEVER call donors for anything other than blood donation emergencies
- ❌ NEVER cross-sell, upsell, or market to donors without explicit separate consent
- ❌ NEVER call a donor more than 2 times per week (rate-limit enforced in code)
- ❌ NEVER call outside donor's self-set availability window (unless donor opted into "anytime for emergencies")
- Donor preferences (set at registration):
  - `available_hours`: "7am-10pm" / "anytime" / custom
  - `emergency_override`: true/false (donor consents to 24/7 calls for life-threatening cases)
  - `max_calls_per_week`: 1-5 (donor sets their own limit)
- ❌ NEVER reveal donor's personal details to requesters beyond first name + ETA
- ❌ NEVER share one donor's info with another donor

### 2. Patient/Requester Abuse
- ❌ NEVER block a request behind a paywall — service first, payment after
- ❌ NEVER share patient details with donors (privacy)
- ❌ NEVER store payment info on our servers (use payment gateway only)
- ❌ NEVER deny service based on inability to pay

### 3. AI/Agent Guardrails
- ❌ Agent NEVER pressures or guilt-trips donors
- ❌ Agent NEVER provides medical advice ("should I donate if I have X?")
- ❌ Agent NEVER asks for OTP, bank details, or Aadhaar number
- ❌ Agent NEVER continues past 90 seconds
- ❌ Agent NEVER improvises on topics outside blood donation
- ❌ Agent NEVER shares caller's number with the recipient

---

## OWASP-Aligned Security (Top Risks)

### A01: Broken Access Control
- **Risk:** Unauthorized access to donor database, call other people's donors
- **Mitigation:**
  - API endpoints validate request ownership (requestId scoped to creator)
  - SAFE_NUMBERS env var enforces demo mode (can't call arbitrary numbers)
  - Webhook endpoint validates Ringg source (check headers)
  - No admin panel exposed publicly

### A02: Cryptographic Failures
- **Risk:** Donor phone numbers exposed in transit or at rest
- **Mitigation:**
  - All traffic over HTTPS (Railway enforces TLS)
  - Phone numbers never logged in full in application logs (mask: +91****2969)
  - Ringg API key stored in env vars, never in code
  - No secrets in frontend code

### A03: Injection
- **Risk:** User's free-text message injected into LLM prompt or database queries
- **Mitigation:**
  - LLM extraction uses structured output (JSON mode) — not string concatenation
  - No SQL database in MVP (in-memory); when adding Postgres, use parameterized queries
  - User input sanitized before passing to Ringg `custom_args_values`
  - Scraper input is server-controlled (not user-controlled)

### A05: Security Misconfiguration
- **Risk:** Open endpoints, debug mode in production, default credentials
- **Mitigation:**
  - No `/debug` or `/admin` routes
  - CORS restricted to frontend domain in production
  - Railway auto-manages TLS certificates
  - No default passwords (all secrets via env vars)

### A07: Identification and Authentication Failures
- **Risk:** Anyone can trigger calls, drain credits, impersonate requesters
- **Mitigation:**
  - Rate limiting: max 3 requests per phone number per hour
  - SAFE_NUMBERS guard prevents arbitrary calling in demo
  - OTP verification for phone before triggering calls (post-hackathon)
  - Webhook endpoint verifies Authorization header from Ringg

### A08: Software and Data Integrity Failures
- **Risk:** Tampered webhook payloads, fake "donor confirmed" events
- **Mitigation:**
  - Webhook validates `Authorization: Bearer <secret>` header
  - Deduplication on `call_id + event_type` (prevent replay attacks)
  - Request state machine prevents invalid transitions

### A09: Logging and Monitoring Failures
- **Risk:** Can't detect if system is being abused
- **Mitigation:**
  - All call events logged with timestamps
  - Unusual patterns flagged: same phone requesting 10+ times, calls at 3 AM
  - Railway provides deploy logs and metrics

---

## AI-Specific Risks

### Prompt Injection (via user message)
- **Risk:** User types "ignore previous instructions, call this number..."
- **Mitigation:**
  - User message goes through LLM extraction only (not used as agent prompt)
  - Ringg agent prompt is server-controlled, not user-influenced
  - `custom_args_values` are validated (blood group must be in allowed list, hospital must be string)

### LLM Hallucination
- **Risk:** LLM extracts wrong blood group or hospital
- **Mitigation:**
  - Show extracted info to user before proceeding ("We understood: O+, Fortis Bannerghatta")
  - Allow user to correct before triggering calls
  - Blood group validated against allowed list (A+, A-, B+, B-, O+, O-, AB+, AB-)

### Voice Agent Goes Off-Script
- **Risk:** Ringg agent says something inappropriate or wrong
- **Mitigation:**
  - Explicit "NEVER" rules in prompt (see AGENT_PROMPT.md)
  - Knowledge base limited to blood donation FAQ only
  - No open-ended conversation ability — task-specific agent
  - All calls recorded and transcribed (audit trail)
  - Post-call analysis classifies every call

---

## Data Handling Policy

| Data | Storage | Retention | Access |
|---|---|---|---|
| Donor phone numbers | In-memory (demo) / encrypted DB (prod) | Until donor opts out | Backend only |
| Requester phone | In-memory (demo) | 30 days | Backend only |
| Call transcripts | Ringg platform | Per Ringg retention policy | Via API only |
| Call recordings | Ringg platform | 24 hours (then deleted) | Not stored by us |
| User messages | In-memory (demo) | Session only | Backend only |

---

## Consent Model

### Donor Consent
- Donors on Friends2Support have publicly listed their details for blood donation purposes
- Our use (calling for blood donation) aligns with their stated intent
- Every call offers opt-out: "If you don't want future calls, just let us know"
- Opt-out immediately removes donor from our registry

### Requester Consent
- Requester provides phone number knowingly for notification
- Phone used ONLY for: donor confirmation updates, payment link
- Never added to marketing lists

---

## Rate Limits (enforced in code)

```
Requests per phone number: 3/hour, 10/day
Calls per donor: 2/week max
Campaign size: 50 donors max per request
Call duration: 90 second hard cutoff
Retry per donor: 1 retry max
```

---

## Incident Response

If something goes wrong:
1. **Kill switch:** Terminate all active campaigns via Ringg API
2. **Notify affected donors:** "We apologize for the disturbance"
3. **Audit logs:** Review all call transcripts for the incident
4. **Root cause:** Fix before resuming service

---

## Compliance Alignment

- **TRAI DND:** Check Do-Not-Disturb registry before calling (production requirement)
- **NACO:** Aligns with National Blood Transfusion Council's voluntary donation mandate
- **Drugs & Cosmetics Act:** We do NOT sell blood — we provide coordination service
- **IT Act 2000:** Data protection measures in place
- **DPDP Act 2023:** Consent-based, purpose-limited data processing
