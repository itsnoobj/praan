# Submission Form Answers

**Name:** Jeevan D C  
**Phone:** 7259702969  
**Email:** jeevan.var@gmail.com  
**Project Link:** https://github.com/itsnoobj/praan

---

## Job To Be Done: 5

- NL input → Bedrock extracts blood group, hospital, urgency, units, reason
- Searches real public donor registry (Friends2Support, 3M+ donors, 30 returned live)
- Ringg AI calls all matching donors simultaneously in their language
- Agent confirms availability, captures ETA, runs eligibility check
- Structured analysis extracted via Custom Analysis (donor_available, eta, eligibility)
- WhatsApp sent to donor with hospital + requester wa.me link
- Data persisted to Supabase (request, confirmed donor, donation history)
- 7-day impact story + 90-day re-eligibility reminders auto-scheduled
- No-show follow-up scheduled 30 min before ETA; reliability score updated
- Works E2E across repeated tests. Zero judge intervention.

---

## Domain Nuance: 4

- Asks availability + ETA (one question at a time, not a script dump)
- Eligibility disclaimer: 90-day, alcohol 48h, surgery — one compound yes/no
- Objection handling: scared, busy, recently donated, "send on WhatsApp"
- Hindi switch when donor speaks Hindi (2+ sentences)
- Never pressures — "completely voluntary, we won't proceed"
- References specific hospital name + blood group + reason on call
- Repeat donors get warmth: "It's great to hear from you again" + past donation memory
- Not L5: doesn't yet adapt approach based on donor hesitation patterns (eager vs reluctant)

---

## Business Impact: 5

- Metric: time to confirmed donor match — 4-12 hours → under 90 minutes
- 12,000 lives lost daily due to blood unavailability (Govt of India, World Blood Donor Day 2025)
- 540M people >60 min from nearest blood bank (BMJ Global Health 2024)
- Cost: ₹33/activation (Ringg ₹8.50/min × ~4 min connected)
- Revenue: ₹299 coordination fee — charged ONLY after donor arrives
- Margin: 83%. Break-even: 4 activations/month
- Secondary revenue: diagnostic affiliate ₹150/donor routed (opt-in only)
- Pessimistic: 1-3 requests/day at maturity in one city
- Realistic: 16/day across 20 districts within a year
- Not selling blood. Selling coordination speed. Compliant with NACO guidelines.

---

## Memory & Context: 4

- NOW: blood group, hospital, urgency, units, reason — passed to agent as variables
- BEFORE: full donation history in Supabase, queried before each call → "You donated 96 days ago at Apollo and helped save a life"
- BUSINESS RULES: 90-day eligibility enforced in disclaimer, donor consent preferences stored, no-show reliability scoring
- Reminders: 7-day impact story, 90-day re-eligibility — both use historical context
- Memory personalizes agent tone: repeat donors get warmth, first-timers get explanation
- Context survives across sessions (Supabase persists across deploys)
- Not L5: cross-handoff context (donor unavailable last time → reference on next call) in roadmap
