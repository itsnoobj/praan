import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://raktsetu-backend-production.up.railway.app";

export default function DonorPage() {
  const [registered, setRegistered] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    await fetch(`${API_URL}/api/donors/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: f.get("name"), phone: f.get("phone"),
        blood_group: f.get("blood_group"), city: f.get("city"),
        language: f.get("language"), emergency_override: true,
        health_checkup_optin: f.get("health_checkup") === "yes",
      }),
    });
    setRegistered(true);
  }

  if (registered) {
    return (
      <div style={s.page}><div style={s.container}>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={s.checkMark}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>You're in.</h2>
          <p style={{ color: "#666", fontSize: 15 }}>We'll call only when someone truly needs you. Thank you.</p>
        </div>

        {/* Affiliate Banner - Diagnostic Partner */}
        <div style={s.affiliateBanner}>
          <div style={s.affiliateBadge}>🎁 DONOR BENEFIT</div>
          <h3 style={s.affiliateTitle}>Your FREE health checkup is ready</h3>
          <p style={s.affiliateDesc}>As a registered praana donor, get a complimentary Basic Health Screening (Hb, BP, Blood Group Confirmation) at our partner labs.</p>
          <div style={s.affiliatePartners}>
            <a href="https://www.thyrocare.com/aarogyam?ref=praana_donor" target="_blank" rel="noopener" style={s.affiliateBtn}>
              🏥 Book at Thyrocare — FREE
            </a>
            <a href="https://redcliffelabs.com/health-checkup-packages?utm_source=praana&utm_medium=affiliate" target="_blank" rel="noopener" style={s.affiliateBtnAlt}>
              🧪 Book at Redcliffe Labs — FREE
            </a>
          </div>
          <p style={s.affiliateFine}>No payment needed · Walk-in or home collection · Digital reports in 24hrs</p>
        </div>

        {/* Upgrade CTA */}
        <div style={s.upgradeBanner}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <strong style={{ fontSize: 14 }}>Want a Full Body Checkup at ₹999 (MRP ₹3,500)?</strong>
              <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0" }}>Donate 3+ times this year to unlock. Includes 70+ tests.</p>
            </div>
            <a href="https://www.thyrocare.com/aarogyam/full-body?ref=praana_donor_premium" target="_blank" rel="noopener" style={s.upgradeBtn}>View Packages →</a>
          </div>
        </div>

        <a href="#" style={{ color: "#1a1a1a", fontSize: 13, marginTop: 20, display: "inline-block", textAlign: "center", width: "100%" }}>← Back to home</a>
      </div></div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <header style={s.header}>
          <a href="#" style={s.backLink}>← back</a>
          <h1 style={s.brand}><span style={s.brandDot}>●</span> praana</h1>
          <p style={s.tagline}>become a donor · save lives · stay healthy</p>
        </header>

        {/* Hero */}
        <section style={s.hero}>
          <h2 style={s.heroTitle}>One call. Thirty minutes. A life saved.</h2>
          <p style={s.heroSub}>Register once. We call only during emergencies, in your language. You decide each time.</p>
        </section>

        {/* Transparency Pledge */}
        <section style={s.pledge}>
          <div style={s.pledgeInner}>
            <strong>Our pledge:</strong> praana is open-source and transparent. We never sell your data. We never share your number. The code is public on GitHub — anyone can audit it. Revenue comes only from opt-in health checkup affiliates and consented ads. Nothing else. Ever.
          </div>
        </section>

        {/* Two-column layout for desktop */}
        <div style={s.grid}>
          {/* Left: Why + Impact */}
          <div style={s.left}>
            {/* Health Benefits */}
            <section style={s.card}>
              <h3 style={s.cardTitle}>Free health benefits for donors</h3>
              <table style={s.table}>
                <thead>
                  <tr><th style={s.th}>Package</th><th style={s.th}>MRP</th><th style={s.th}>Donor Price</th><th style={s.th}>Eligibility</th></tr>
                </thead>
                <tbody>
                  <tr><td style={s.td}>Basic (Hb, BP, screening)</td><td style={s.td}>₹500</td><td style={{...s.td, fontWeight:700, color:"#16a34a"}}>FREE</td><td style={s.td}>Every donation</td></tr>
                  <tr><td style={s.td}>CBC + Lipid Profile</td><td style={s.td}>₹1,200</td><td style={{...s.td, fontWeight:700}}>₹299</td><td style={s.td}>2+ donations</td></tr>
                  <tr><td style={s.td}>Full Body Checkup</td><td style={s.td}>₹3,500</td><td style={{...s.td, fontWeight:700}}>₹999</td><td style={s.td}>3+ donations/year</td></tr>
                </tbody>
              </table>
              <div style={s.affiliateCTAs}>
                <a href="https://www.thyrocare.com/aarogyam?ref=praana_donor" target="_blank" rel="noopener" style={s.ctaLink}>
                  🏥 Book via Thyrocare
                </a>
                <a href="https://redcliffelabs.com/health-checkup-packages?utm_source=praana&utm_medium=affiliate" target="_blank" rel="noopener" style={s.ctaLink}>
                  🧪 Book via Redcliffe Labs
                </a>
              </div>
              <p style={s.fine}>Powered by partner diagnostic labs · Digital reports · No hidden costs</p>
            </section>

            {/* Impact Memory */}
            <section style={s.card}>
              <h3 style={s.cardTitle}>We remember every donation</h3>
              <div style={s.timeline}>
                <div style={s.timelineItem}>
                  <div style={s.dot} />
                  <div>
                    <div style={s.timeDate}>14 Mar 2026 · Fortis Bannerghatta</div>
                    <div style={s.timeText}>Donated O+ → <em style={{ color: "#16a34a" }}>A 4-year-old with dengue recovered</em></div>
                  </div>
                </div>
                <div style={s.timelineItem}>
                  <div style={s.dot} />
                  <div>
                    <div style={s.timeDate}>8 Dec 2025 · Apollo Hospital</div>
                    <div style={s.timeText}>Donated O+ → <em style={{ color: "#16a34a" }}>Emergency surgery patient discharged in 3 days</em></div>
                  </div>
                </div>
              </div>
              <p style={s.memoryNote}>
                When we call you again, the agent says:<br />
                <em>"You saved a child's life 90 days ago at Fortis. There's another emergency today — can you help again?"</em>
              </p>
            </section>

            {/* Transparent Financials */}
            <section style={s.card}>
              <h3 style={s.cardTitle}>Where the money goes (100% transparent)</h3>
              <p style={s.cardSub}>praana is open-source. We don't see your data. We don't profit from emergencies. Platform sustains itself through:</p>
              <div style={{fontSize:13,color:"#333",marginBottom:12,lineHeight:1.8}}>
                <strong>Revenue (to keep the lights on):</strong><br/>
                1. Opt-in health checkup affiliates (diagnostic labs pay us per donor routed)<br/>
                2. Consented ads only (donor explicitly opts in, can opt out anytime)<br/><br/>
                <strong>That's it. Nothing else. No data selling. No premium tiers. No paywalls.</strong>
              </div>
              <table style={s.table}>
                <thead>
                  <tr><th style={s.th}>Cost</th><th style={s.th}>Per Activation</th><th style={s.th}>Covered By</th></tr>
                </thead>
                <tbody>
                  <tr><td style={s.td}>Voice calls (Ringg AI, ~2-3 min)</td><td style={s.td}>~₹20–25</td><td style={s.td}>₹300+ activation fee</td></tr>
                  <tr><td style={s.td}>WhatsApp/SMS notifications</td><td style={s.td}>~₹3–5</td><td style={s.td}>₹300+ activation fee</td></tr>
                  <tr><td style={s.td}>Ops (platform, infra, DB)</td><td style={s.td}>~₹10–15</td><td style={s.td}>₹300+ activation fee</td></tr>
                  <tr style={{background:"#f0fdf4"}}><td style={{...s.td,fontWeight:600}}>Health checkups for donors</td><td style={{...s.td,fontWeight:600}}>₹0 to us</td><td style={{...s.td,fontWeight:600}}>Lab pays us ₹150/referral</td></tr>
                </tbody>
              </table>
              <p style={s.fine}>
                All code is open-source. All finances will be published monthly.<br/>
                <a href="https://github.com/itsnoobj/praan" target="_blank" rel="noopener" style={s.ghLink}>GitHub → View source, audit everything</a>
              </p>
            </section>
          </div>

          {/* Right: Registration Form */}
          <div style={s.right}>
            <section style={s.formCard}>
              <h3 style={s.cardTitle}>Register in 30 seconds</h3>
              <form onSubmit={handleRegister} style={s.form}>
                <input name="name" placeholder="Your name" required style={s.input} />
                <input name="phone" type="tel" placeholder="+91 number" required style={s.input} />
                <select name="blood_group" required style={s.input}>
                  <option value="">Blood Group</option>
                  {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g => <option key={g} value={g}>{g}</option>)}
                  <option value="unknown">Don't know</option>
                </select>
                <input name="city" placeholder="City / Village" style={s.input} />
                <select name="language" style={s.input}>
                  <option value="en-IN">English</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="ta-IN">Tamil</option>
                  <option value="te-IN">Telugu</option>
                  <option value="kn-IN">Kannada</option>
                  <option value="bn-IN">Bengali</option>
                  <option value="mr-IN">Marathi</option>
                </select>
                <label style={s.optin}>
                  <input type="checkbox" name="health_checkup" value="yes" defaultChecked />
                  <span>Send me free health reports & lab offers on WhatsApp after I donate</span>
                </label>
                <button type="submit" style={s.btn}>Register as donor</button>
              </form>
              <div style={s.promises}>
                <span>✓ Only emergency calls</span>
                <span>✓ Your language</span>
                <span>✓ Opt out anytime</span>
              </div>
            </section>
          </div>
        </div>

        {/* How Everyone Benefits — Flywheel */}
        <section style={s.flywheel}>
          <h3 style={s.fwTitle}>How it works — everyone benefits</h3>
          <div style={s.fwGrid}>
            <div style={s.fwCard}>
              <div style={s.fwEmoji}>🆘</div>
              <div style={s.fwRole}>Patient / Family</div>
              <div style={s.fwBenefit}>Gets a confirmed donor in minutes, not hours. Pays ₹300+ only after donor arrives. No donor = ₹0.</div>
            </div>
            <div style={s.fwCard}>
              <div style={s.fwEmoji}>🩸</div>
              <div style={s.fwRole}>Donor (you)</div>
              <div style={s.fwBenefit}>Save a life with 30 min of your time. Get free health reports, subsidized checkups, and impact stories. Called only in emergencies, in your language.</div>
            </div>
            <div style={s.fwCard}>
              <div style={s.fwEmoji}>🏥</div>
              <div style={s.fwRole}>Diagnostic Labs</div>
              <div style={s.fwBenefit}>Get health-conscious walk-ins (donors) at zero acquisition cost. Pay praana ₹150/referral. Donors get subsidized checkups. Win-win.</div>
            </div>
          </div>
          <div style={s.fwLoop}>
            <svg viewBox="0 0 500 360" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",maxWidth:440,height:"auto",margin:"0 auto",display:"block"}}>
              {/* Center */}
              <circle cx="250" cy="180" r="40" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2"/>
              <text x="250" y="175" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16a34a">self</text>
              <text x="250" y="190" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16a34a">sustaining</text>

              {/* Circular arrows */}
              <path d="M 250 80 A 100 100 0 0 1 350 180" fill="none" stroke="#e2e8f0" strokeWidth="2" markerEnd="url(#arrow)"/>
              <path d="M 350 180 A 100 100 0 0 1 250 280" fill="none" stroke="#e2e8f0" strokeWidth="2" markerEnd="url(#arrow)"/>
              <path d="M 250 280 A 100 100 0 0 1 150 180" fill="none" stroke="#e2e8f0" strokeWidth="2" markerEnd="url(#arrow)"/>
              <path d="M 150 180 A 100 100 0 0 1 250 80" fill="none" stroke="#e2e8f0" strokeWidth="2" markerEnd="url(#arrow)"/>
              <defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#94a3b8"/></marker></defs>

              {/* Nodes */}
              {/* Top */}
              <rect x="185" y="25" width="130" height="36" rx="8" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5"/>
              <text x="250" y="48" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1a1a1a">Family pays ₹300+</text>

              {/* Right top */}
              <rect x="370" y="100" width="120" height="36" rx="8" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5"/>
              <text x="430" y="123" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1a1a1a">Covers call costs</text>

              {/* Right bottom */}
              <rect x="370" y="215" width="120" height="44" rx="8" fill="#fff" stroke="#bbf7d0" strokeWidth="1.5"/>
              <text x="430" y="234" textAnchor="middle" fontSize="10" fontWeight="600" fill="#15803d">Diagnostic labs</text>
              <text x="430" y="248" textAnchor="middle" fontSize="10" fontWeight="600" fill="#15803d">pay ₹150/referral</text>

              {/* Bottom */}
              <rect x="170" y="295" width="160" height="44" rx="8" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5"/>
              <text x="250" y="314" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a1a1a">Donors get free checkups</text>
              <text x="250" y="328" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a1a1a">→ stay engaged → donate again</text>

              {/* Left bottom */}
              <rect x="10" y="215" width="120" height="44" rx="8" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5"/>
              <text x="70" y="234" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a1a1a">More donors</text>
              <text x="70" y="248" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1a1a1a">available</text>

              {/* Left top */}
              <rect x="10" y="100" width="120" height="36" rx="8" fill="#fff" stroke="#e2e8f0" strokeWidth="1.5"/>
              <text x="70" y="123" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1a1a1a">Faster matches</text>
            </svg>
            <p style={{textAlign:"center",fontSize:11,color:"#888",marginTop:8}}>Funded by diagnostic lab referrals + activation fees · No external funding needed · Break-even at 4 activations/month</p>
          </div>
        </section>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f7f7f7", padding: "20px 16px" },
  container: { maxWidth: 960, margin: "0 auto", fontFamily: "'Inter', -apple-system, system-ui, sans-serif" },

  header: { textAlign: "center", marginBottom: 20, position: "relative" },
  backLink: { position: "absolute", left: 0, top: 4, fontSize: 13, color: "#888", textDecoration: "none" },
  brand: { fontSize: 32, fontWeight: 700, margin: 0, color: "#1a1a1a", letterSpacing: "-1px" },
  brandDot: { color: "#dc2626", fontSize: 14, verticalAlign: "super" },
  tagline: { fontSize: 13, color: "#888", marginTop: 4 },

  hero: { textAlign: "center", marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: 600, margin: "0 0 6px", color: "#1a1a1a" },
  heroSub: { fontSize: 14, color: "#666", margin: 0 },

  pledge: { marginBottom: 20 },
  pledgeInner: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#1a1a1a", lineHeight: 1.7, textAlign: "center" },

  flywheel: { marginBottom: 24 },
  fwTitle: { fontSize: 16, fontWeight: 600, marginBottom: 14, color: "#1a1a1a", textAlign: "center" },
  fwGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 },
  fwCard: { background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 16, textAlign: "center" },
  fwEmoji: { fontSize: 28, marginBottom: 8 },
  fwRole: { fontSize: 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 },
  fwBenefit: { fontSize: 12, color: "#555", lineHeight: 1.6 },
  fwLoop: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 16 },

  grid: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" },
  left: { display: "flex", flexDirection: "column", gap: 16 },
  right: { position: "sticky", top: 20 },

  card: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "18px 20px" },
  cardTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 10px", color: "#1a1a1a" },
  cardSub: { fontSize: 13, color: "#666", margin: "0 0 12px" },

  timeline: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 },
  timelineItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  dot: { width: 8, height: 8, borderRadius: 4, background: "#16a34a", marginTop: 5, flexShrink: 0 },
  timeDate: { fontSize: 11, color: "#999", fontWeight: 500 },
  timeText: { fontSize: 13, color: "#333" },
  memoryNote: { fontSize: 13, color: "#555", background: "#f8f9ff", padding: 12, borderRadius: 8, lineHeight: 1.6, margin: 0 },

  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #eee", color: "#888", fontWeight: 500, fontSize: 11 },
  td: { padding: "8px 6px", borderBottom: "1px solid #f5f5f5", color: "#333" },
  fine: { fontSize: 11, color: "#aaa", marginTop: 10, marginBottom: 0, lineHeight: 1.6 },
  ghLink: { color: "#1a1a1a", fontWeight: 500 },

  formCard: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "18px 20px" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: { padding: 12, border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 14, background: "#fafafa", boxSizing: "border-box" },
  optin: { display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#555", cursor: "pointer" },
  btn: { padding: 14, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 },
  promises: { display: "flex", justifyContent: "center", gap: 12, fontSize: 11, color: "#999", marginTop: 10, flexWrap: "wrap" },

  checkMark: { width: 52, height: 52, borderRadius: 26, background: "#ecfdf5", color: "#16a34a", fontSize: 26, lineHeight: "52px", margin: "0 auto 14px", fontWeight: 600 },

  affiliateBanner: { background: "#fff", border: "2px solid #bbf7d0", borderRadius: 12, padding: "24px", marginBottom: 16, textAlign: "center" },
  affiliateBadge: { display: "inline-block", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4, marginBottom: 12 },
  affiliateTitle: { fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: "#1a1a1a" },
  affiliateDesc: { fontSize: 13, color: "#555", margin: "0 0 16px", lineHeight: 1.6 },
  affiliatePartners: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" },
  affiliateBtn: { padding: "12px 20px", background: "#16a34a", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600 },
  affiliateBtnAlt: { padding: "12px 20px", background: "#1a1a1a", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600 },
  affiliateFine: { fontSize: 11, color: "#999", marginTop: 12, marginBottom: 0 },
  upgradeBanner: { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "16px 20px", marginBottom: 16 },
  upgradeBtn: { padding: "10px 16px", background: "#f59e0b", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  affiliateCTAs: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" },
  ctaLink: { padding: "8px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, textDecoration: "none", fontSize: 12, fontWeight: 500, color: "#15803d" },

  // Mobile override via media query isn't possible inline, but grid will stack naturally below 640px
  // The 320px column will overflow on very small screens — acceptable for hackathon demo
};
