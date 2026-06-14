# Submission Form Answers

**Name:** Jeevan D C

**Phone:** 7259702969

**Email:** jeevan.var@gmail.com

**Project Link:** https://github.com/itsnoobj/praan

---

## Rate yourself on "Job To Be Done": 5

The agent completes the job end-to-end without judge intervention. From natural language input → AI extraction → live donor search from a real public registry (Friends2Support, 30 donors found) → parallel Ringg AI voice calls → donor confirms on call with ETA + eligibility check → structured analysis extracted → WhatsApp notification with hospital + requester contact sent to donor → data persisted to Supabase → reminders scheduled. Works across repeated test cases. No manual step needed.

---

## Rate yourself on "Domain Nuance": 4

Agent understands the blood donation workflow: asks availability + ETA, runs eligibility disclaimer (90-day, alcohol, surgery), handles objections (scared, busy, recently donated), switches to Hindi when donor prefers, knows to not pressure, references the specific hospital and blood group. Uses donor memory to personalize — repeat donors hear "you saved a life last time." Not yet L5 because it doesn't adapt negotiation style based on donor behavioral patterns (e.g., hesitant vs eager donors).

---

## Rate yourself on Business Impact: 5

Transformational. Moves donor match time from 4-12 hours (manual calling) to under 90 minutes (parallel AI calls). Baseline: 12,000 deaths/day due to blood unavailability in India (Times of India, 2025). 540M people in blood deserts (BMJ Global Health, 2024). Unit economics: ₹33 cost/activation, ₹299 revenue, 83% gross margin. Self-sustaining via activation fees + diagnostic affiliate (₹150/donor routed). Break-even at 4 activations/month. Pessimistic: 1-3 requests/day at maturity. Realistic: 16/day at 20 districts within a year.

---

## Rate yourself on Memory & Context: 4

Three memory layers implemented: (1) NOW — current request context (blood group, hospital, urgency, units, reason) passed as variables to agent, (2) BEFORE — full donation history stored in Supabase, queried before each call, passed as donor_memory ("You donated 96 days ago at Apollo and helped save a life"), (3) BUSINESS RULES — 90-day eligibility enforced in the eligibility disclaimer, consent preferences stored per donor. Context survives across calls. Reminders at 7 days (impact story) and 90 days (re-eligibility) use historical context. Not L5 because we don't yet have cross-handoff context (e.g., if donor was unavailable on first call, second call references that).
