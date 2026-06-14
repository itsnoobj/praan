# Blood Donor Activation Network — Business Model

## One-Liner

Voice-AI powered marketplace that matches blood requests to verified donors in under 2 hours, monetized through activation fees, diagnostic partnerships, and health-commerce.

---

## The Problem

- India needs 12M+ blood units/year, faces a chronic 25% shortage (~3M units)
- When blood is needed urgently (accidents, surgeries, deliveries), families are told: "Arrange your own replacement donors"
- Families panic-post on WhatsApp groups, social media, or resort to illegal paid donors
- Existing blood bank registries are paper-based, outdated, and manually activated (one person calling from a list)
- Time to find a matching donor: 4-12 hours average. For trauma cases, this is too late.

---

## The Solution

A voice-AI activation network that:
1. Maintains an opt-in donor registry with verified blood groups and location
2. On emergency request → blasts 50-100 calls simultaneously via Ringg AI
3. Voice agent confirms availability in donor's language (Hindi, Kannada, Tamil, etc.)
4. Confirmed donors are relayed to requester in real-time
5. Post-donation follow-up creates retention + monetization loop

---

## Customer Segments & Willingness to Pay

| Segment | Pain Level | Willingness to Pay | Sales Cycle |
|---|---|---|---|
| Patient families (B2C) | Extreme (life-or-death) | ₹200-500 per request | Zero (instant) |
| Blood banks | High (inventory shortages) | ₹10-30K/month | 2-4 weeks |
| Hospital chains (Apollo, Max, Fortis) | High (surgical delays) | ₹50K-2L/month | 1-3 months |
| State Blood Transfusion Councils | Medium (mandate compliance) | Govt tender (₹10-50L) | 3-6 months |
| Corporate CSR teams | Low-Medium (ESG scores) | ₹50K-2L per drive | 1-2 months |

---

## Revenue Streams

### Primary (Day 1)

**1. Activation Fee — Patient/Family**
- ₹299-499 per urgent donor match request
- SLA: confirmed donor within 2 hours or money back
- Think "Urban Company for blood donors"
- No selling blood (illegal) — selling the search + coordination service

**2. Blood Bank Subscription**
- Monthly plan for proactive inventory replenishment campaigns
- Ringg agent calls donors 3 days before projected shortage
- ₹15-30K/month (replaces 2-3 manual calling staff costing ₹60K/month)

### Secondary (Month 3+)

**3. Diagnostic Center Partnerships**
- Route donors to diagnostic centers (Thyrocare, SRL, Metropolis) as donation venues
- Diagnostic center upsells health checkup packages to walk-in donors
- Revenue: ₹100-150 per donor routed + rev-share on checkup upsell

**4. Post-Donation Health Report (Sponsored)**
- 48-hour follow-up call delivers donation results + offers free/discounted health check from partner diagnostic
- Diagnostic pays ₹150-300 per converted appointment
- Donor gets value → higher retention

**5. Pharma Sampling**
- Post-donation iron supplement recommendation
- Pharma cos (Shelcal, Livogen) pay ₹30-50 per targeted sample to verified health-conscious audience
- Massive existing pharma sampling budget (₹3000-5000 Cr industry)

### Tertiary (Month 6+)

**6. Insurance Leads**
- Regular donors (3+ donations) are actuarially better risks
- Partner with Star Health, HDFC Ergo, Digit for "healthy donor" premium discounts
- Revenue: ₹500-1500 per policy lead converted
- Donor incentive: 10-15% premium discount

**7. Clinical Trial Recruitment**
- Verified, health-screened, consent-based database
- CROs pay $50-200 per enrolled participant globally
- Activate via voice call: "Would you be interested in a paid health study?"

**8. Corporate Wellness Drives**
- Sell to corporates as CSR + employee engagement
- Ringg agent coordinates drives, confirms slots, reports impact to HR
- ₹50K-2L per corporate drive

---

## Unit Economics

| Metric | Value |
|---|---|
| Cost per Ringg call | ₹2-4 |
| Calls per activation (50 donors) | ₹100-200 |
| Activation fee charged | ₹299-499 |
| Gross margin per activation | ~60-70% |
| Donor confirmation rate (est.) | 8-15% |
| Donors needed per successful match | ~10-15 called |

### Donor Lifetime Value (annual, 3 donations)

| Source | Annual Revenue |
|---|---|
| Activation fee share | ₹300 |
| Diagnostic routing | ₹450 |
| Health checkup rev-share | ₹225 |
| Pharma sampling | ₹120 |
| Insurance (one-time) | ₹800 |
| **Total LTV per donor** | **~₹1,900/year** |

---

## The Flywheel

```
Patient family pays ₹299 for urgent match
  → Ringg calls 50 donors (cost ₹150)
  → Donor confirms, donates
  → Post-donation call: health report + diagnostic upsell
  → Donor stays engaged (impact stories, health tips)
  → Donor refers friends → registry grows
  → More donors = faster matches = more requests
  → Hospital/blood bank sees value → signs up for bulk plan
  → Volume = better data = predictive inventory
  → Govt notices → pilot contract
```

---

## Market Sizing (India)

| Metric | Value |
|---|---|
| Annual blood requirement | 12M+ units |
| Shortage | ~3M units (25%) |
| Emergency activations addressable | ~3M/year |
| At ₹500/activation (blended) | ₹150 Cr TAM |
| Diagnostic/Insurance/Pharma layer | ₹100+ Cr additional |
| Total addressable | ₹250+ Cr/year |

---

## Platform Architecture (Multi-Sided)

```
        ┌──────────────────────────────────────────────┐
        │     PLATFORM (Voice AI + Donor Registry)      │
        └──────┬──────────────────┬────────────────────┘
               │                  │
   ┌───────────▼──────┐   ┌──────▼───────────────┐
   │   DEMAND SIDE     │   │    SUPPLY SIDE        │
   │                   │   │    (Donor Network)    │
   ├───────────────────┤   ├──────────────────────┤
   │ Patient families  │   │ Voluntary donors     │
   │ Blood banks       │   │ Corporate donors     │
   │ Hospital chains   │   │ College donors       │
   │ Govt (SBTC)       │   │ Repeat donors        │
   └───────────────────┘   └──────────┬───────────┘
                                      │
               ┌──────────────────────┼──────────────────┐
               │                      │                  │
      ┌────────▼──────┐    ┌─────────▼──────┐   ┌──────▼───────┐
      │  Diagnostics   │    │   Insurance    │   │    Pharma    │
      │  ₹100-300/     │    │   ₹500-1500/  │   │   ₹30-50/   │
      │   donor        │    │    policy      │   │    donor     │
      └───────────────┘    └────────────────┘   └──────────────┘
```

---

## Go-to-Market (Phased)

**Phase 1 (Hackathon → Month 1): Prove the core loop**
- Single city (Bangalore)
- 500 donors via college drives + NGO partnerships
- B2C activation (family pays ₹299)
- WhatsApp + web intake → Ringg activation

**Phase 2 (Month 2-6): Add supply + demand**
- Partner with 3-5 blood banks for registry access
- Onboard 2-3 diagnostic centers as donation venues
- Launch corporate drives for donor acquisition
- Target: 10K donors, 500 activations/month

**Phase 3 (Month 6-12): Platform play**
- Insurance + pharma partnerships
- Multi-city expansion (top 5 metros)
- Blood bank SaaS product
- Govt SBTC pilot in 1 state
- Target: 100K donors, 5000 activations/month

---

## Competitive Moat

1. **Network effect**: More donors → faster match → more requests → more donors
2. **Voice-first**: Works on any phone, any language — reaches donors that apps can't
3. **Data asset**: Verified, consent-based health identity graph (blood group, screening history, location, responsiveness)
4. **Switching cost**: Once a blood bank integrates and relies on your activation, switching is operationally painful
5. **Regulatory alignment**: Supports voluntary donation (NACO mandate), doesn't sell blood

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Donors don't pick up calls | Time-of-day optimization, impact stories, health incentives |
| Low initial donor supply | College drives, NGO partnerships, diagnostic center walk-in capture |
| Regulatory concerns (selling blood?) | Crystal clear: selling search/coordination service, blood remains free |
| Blood bank resistance | Start B2C (families), prove value, blood banks come to you |
| Ringg call costs at scale | Volume pricing negotiation, predictive calling reduces waste |

---

## Success Metrics

| Metric | Target (6 months) |
|---|---|
| Donor registry size | 10,000+ |
| Avg time to confirmed match | < 90 minutes |
| Activation success rate | > 80% |
| Donor answer rate | > 25% |
| Monthly activations | 500+ |
| Revenue run-rate | ₹15-20L/month |
