import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://raktsetu-backend-production.up.railway.app";

export default function App() {
  const [step, setStep] = useState("input");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [requestId, setRequestId] = useState(null);
  const [events, setEvents] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    if (!requestId) return;
    const es = new EventSource(`${API_URL}/api/stream/${requestId}`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      setEvents((prev) => [...prev, event]);
      if (event.type === "donor_confirmed") {
        setConfirmed((prev) => [...prev, event.donor]);
        setStep("confirmed");
      }
    };
    return () => es.close();
  }, [requestId]);

  useEffect(() => {
    feedRef.current?.scrollTo(0, feedRef.current.scrollHeight);
  }, [events]);

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser. Use Chrome."); return; }
    const r = new SR();
    r.lang = "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.onstart = () => setIsListening(true);
    r.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
      setMessage(transcript);
    };
    r.onerror = (e) => { console.error("Speech error:", e.error); setIsListening(false); };
    r.onend = () => setIsListening(false);
    r.start();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim() || !phone.trim()) return;
    setStep("processing");
    setEvents([]);
    setConfirmed([]);
    const res = await fetch(`${API_URL}/api/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim(), phone: phone.trim() }),
    });
    const data = await res.json();
    setRequestId(data.request_id);
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.header}>
          <h1 style={s.brand}><span style={{color:"#dc2626",fontSize:14,verticalAlign:"super"}}>●</span> praana</h1>
          <p style={s.tagline}>blood, when life needs it</p>
        </header>

        {step === "input" && (
          <>
            <div style={s.stats}>
              <span>Finds donors in minutes, not hours</span>
              <span style={s.statDot}>·</span>
              <span>50 donors called at once</span>
              <span style={s.statDot}>·</span>
              <span>Speaks Hindi, English, Tamil & more</span>
            </div>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={"e.g. Need 2 units O+ blood at Fortis Bannerghatta, friend in surgery after accident\n\nThe more details you share (reason, units needed, hospital), the faster donors respond."}
                  rows={5}
                  style={s.textarea}
                />
              </div>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your WhatsApp number"
                style={s.input}
              />

              <button type="submit" style={s.btn} disabled={!message.trim() || !phone.trim()}>
                Find donors
              </button>

              <p style={s.trust}>No signup · <details style={{display:"inline"}}><summary style={{display:"inline",cursor:"pointer",textDecoration:"underline"}}>Pay ₹299 only if donor arrives</summary><span style={{display:"block",marginTop:4,fontSize:11,color:"#666",lineHeight:1.5}}>This fee covers voice AI calls, WhatsApp delivery, and keeps the platform running without ads or data selling. No donor found = ₹0. We don't profit — we sustain.</span></details> · No donor = ₹0</p>

              <details style={s.demoBox}>
                <summary style={s.demoSummary}>📞 Try it: hear what donors hear when you call</summary>
                <p style={{fontSize:11,color:"#92400e",margin:"8px 0 6px"}}>Add your number below. On the next request, our AI voice agent will call YOU — so you can experience exactly what a donor hears.</p>
                <div style={s.demoFields}>
                  <input id="demo-name" placeholder="Your name" style={s.demoInput} />
                  <input id="demo-phone" placeholder="Phone (10 digits)" style={s.demoInput} />
                  <button type="button" style={s.demoBtn} onClick={() => {
                    const n = document.getElementById("demo-name").value;
                    const p = document.getElementById("demo-phone").value;
                    if (n && p) { fetch(`${API_URL}/api/donors/register`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({name:n,phone:p,blood_group:"O+",city:"Bangalore",language:"en-IN",emergency_override:true}) }).then(()=>alert("Done! Submit a request above and you'll get the call.")); }
                  }}>Add my number</button>
                </div>
              </details>
            </form>

            <div style={s.donorCta}>
              <p style={s.donorCtaText}>Want to save a life someday?</p>
              <a href="#donor" style={s.donorBtn}>Become a donor</a>
              <p style={s.donorStats}>
                <a href="https://timesofindia.indiatimes.com/life-style/health-fitness/health-news/blood-donation-are-you-eligible-to-donate-blood-all-about-the-rules-of-blood-donation/articleshow/117388629.cms" target="_blank" rel="noopener" style={s.cite}>12,000 lives lost daily</a> · <a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0265951" target="_blank" rel="noopener" style={s.cite}>14.6M units needed/year</a> · 1 donation saves 3 lives
              </p>
            </div>
            <details style={s.dataSource}>
              <summary style={s.dataSourceTitle}>Where do we find donors?</summary>
              <img src="/friends2support-screenshot.png" alt="Friends2Support" style={{width:"100%",borderRadius:8,border:"1px solid #eee",marginTop:10}} />
              <p style={s.dataSourceNote}>
                Real data from <a href="https://www.friends2support.org/inner/news/searchresult.aspx" target="_blank" rel="noopener" style={{color:"#1a1a1a",fontWeight:500}}>Friends2Support.org</a> — 3M+ voluntary donors across India. We pull by blood group, city & area via AI agent. More registries coming.
              </p>
            </details>
            {/* How it works */}
            <div style={s.workflow}>
              <h3 style={s.wfTitle}>How praana works</h3>
              <div style={s.wfSteps}>
                <div style={s.wfStep}><span style={s.wfNum}>1</span><span>You describe your need in plain text — any language</span></div>
                <div style={s.wfArrow}>↓</div>
                <div style={s.wfStep}><span style={s.wfNum}>2</span><span>AI extracts blood group, hospital, units & maps to nearest donor-searchable area</span></div>
                <div style={s.wfArrow}>↓</div>
                <div style={s.wfStep}><span style={s.wfNum}>3</span><span>Searches real donor registries by blood group + location <span style={{fontSize:10,color:"#999"}}>(3M+ donors on Friends2Support)</span></span></div>
                <div style={s.wfArrow}>↓</div>
                <div style={s.wfStep}><span style={s.wfNum}>4</span><span>Voice AI calls all matching donors simultaneously — in their language</span></div>
                <div style={s.wfArrow}>↓</div>
                <div style={s.wfStep}><span style={s.wfNum}>5</span><span>Confirmed donor gets your WhatsApp link + hospital details instantly</span></div>
                <div style={s.wfArrow}>↓</div>
                <div style={s.wfStep}><span style={s.wfNum}>6</span><span>System remembers every donation — repeat donors hear their impact story on next call</span></div>
              </div>
              <div style={s.wfDisclaimer}>
                <strong>Memory:</strong> The agent uses 3 layers — current request (blood group, hospital, urgency), donor history (past donations, impact stories from DB), and business rules (90-day eligibility, consent preferences). Repeat donors hear their impact story. First-time donors get a clear explanation.
                <br/><br/>
                <strong>Privacy & Safety:</strong> Donor phone numbers are never shared with you. Only your number is shared with the confirmed donor. All calls are consent-based. Currently in demo mode — only verified numbers are called.
              </div>
            </div>

            <footer style={s.footer}>
              <p style={s.ghFooter}>
                Open source · <a href="https://github.com/itsnoobj/praan" target="_blank" rel="noopener" style={s.ghFooterLink}>GitHub</a> · Built with <a href="https://www.ringg.ai" target="_blank" rel="noopener" style={s.ghFooterLink}>Ringg AI</a> · Voice-AI blood donor activation for India
              </p>
            </footer>
          </>
        )}

        {step === "processing" && (
          <div style={s.feedWrap}>
            <p style={s.feedTitle}>Finding you a donor...</p>
            <div ref={feedRef} style={s.feed}>
              {events.length === 0 && <div style={s.event}><span style={s.icon}>⏳</span>Understanding your request...</div>}
              {events.map((ev, i) => (
                <div key={i} style={s.event}>
                  <span style={s.icon}>{icon(ev.type)}</span>
                  <span style={s.eventTime}>{i === 0 ? "0s" : `+${((ev.timestamp - events[0].timestamp) / 1000).toFixed(1)}s`}</span>
                  {ev.message || ev.type}
                  {ev.type === "donors_found" && ev.donors && (
                    <div style={s.donorList}>{ev.donors.map((d,j) => <span key={j} style={s.donorTag}>{d.name.split(" ")[0]}</span>)}</div>
                  )}
                </div>
              ))}
              {events.length > 0 && ["call_initiated","call_started"].includes(events[events.length - 1]?.type) && (
                <div style={s.waiting}>
                  <div style={s.pulse} />
                  <span>Call in progress — waiting for donor's response...</span>
                </div>
              )}
              {events.length > 0 && events[events.length - 1]?.type === "call_completed" && step === "processing" && (
                <div style={s.waiting}>
                  <div style={s.pulse} />
                  <span>Call ended — analyzing response...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "confirmed" && (
          <div style={s.result}>
            <div style={s.checkMark}>✓</div>
            <h2 style={s.resultTitle}>Donor confirmed</h2>
            {confirmed.map((d, i) => (
              <div key={i} style={s.donorCard}>
                <span style={s.donorName}>{d.name}</span>
                <span style={s.donorEta}>~{d.eta || "30"} min away</span>
              </div>
            ))}
            <p style={s.resultNote}>Hospital details and requester's WhatsApp sent to donor.</p>

            <div style={s.systemActions}>
              <p style={s.systemTitle}>What happened behind the scenes:</p>
              <div style={s.systemItem}>✓ Donor confirmation saved to database</div>
              <div style={s.systemItem}>✓ WhatsApp with hospital + requester link sent to donor</div>
              <div style={s.systemItem}>✓ 7-day impact story reminder scheduled</div>
              <div style={s.systemItem}>✓ 90-day re-eligibility reminder scheduled</div>
              <div style={s.systemItem}>✓ Donor memory updated for next call personalization</div>
            </div>
            <details style={{ marginTop: 20, textAlign: "left" }}>
              <summary style={s.detailsToggle}>Activity log</summary>
              <div style={s.feed}>
                {events.map((ev, i) => (
                  <div key={i} style={s.event}>
                    <span style={s.icon}>{icon(ev.type)}</span>
                    {ev.message || ev.type}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function icon(t) {
  return { extracting: "◌", extracted: "✓", searching: "◌", page_scraped: "◌", donors_found: "◉", filtered: "◉", calling: "◎", call_initiated: "◎", call_started: "◎", call_completed: "◉", analysis_complete: "◉", donor_confirmed: "●", donor_unavailable: "○", notification_sent: "●", language_selected: "◌", scrape_error: "△", call_error: "△" }[t] || "·";
}

const s = {
  page: { minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "80px 20px 40px" },
  container: { width: "100%", maxWidth: 640, fontFamily: "'Inter', -apple-system, system-ui, sans-serif", color: "#1a1a1a" },

  header: { textAlign: "center", marginBottom: 32 },
  brand: { fontSize: 42, fontWeight: 700, margin: 0, color: "#1a1a1a", letterSpacing: "-1px" },
  tagline: { fontSize: 16, color: "#888", marginTop: 8 },

  stats: { display: "flex", justifyContent: "center", gap: 8, fontSize: 12, color: "#999", marginBottom: 24, flexWrap: "wrap" },
  statDot: { color: "#ddd" },

  form: { display: "flex", flexDirection: "column", gap: 12 },
  field: { position: "relative" },
  textarea: { width: "100%", padding: 20, border: "1px solid #e0e0e0", borderRadius: 12, fontSize: 16, fontFamily: "inherit", resize: "none", boxSizing: "border-box", background: "#fff", color: "#1a1a1a", lineHeight: 1.6 },
  mic: { position: "absolute", right: 12, bottom: 12, padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  input: { padding: 18, border: "1px solid #e0e0e0", borderRadius: 12, fontSize: 16, background: "#fff", color: "#1a1a1a", boxSizing: "border-box" },
  btn: { padding: 18, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 12, fontSize: 17, fontWeight: 600, cursor: "pointer" },
  trust: { textAlign: "center", fontSize: 12, color: "#999", margin: 0 },
  demoBox: { marginTop: 12, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px" },
  demoSummary: { fontSize: 12, color: "#92400e", cursor: "pointer" },
  demoFields: { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" },
  demoInput: { flex: 1, minWidth: 120, padding: 8, border: "1px solid #fde68a", borderRadius: 6, fontSize: 13 },
  demoBtn: { padding: "8px 12px", background: "#92400e", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" },

  feedWrap: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 14, padding: 20 },
  feedTitle: { margin: "0 0 14px", fontSize: 15, fontWeight: 500, color: "#333" },
  feed: { maxHeight: 360, overflowY: "auto", fontSize: 13, lineHeight: 2.0 },
  event: { color: "#555" },
  eventTime: { fontSize: 10, color: "#aaa", marginRight: 6, minWidth: 36, display: "inline-block" },
  donorList: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 },
  donorTag: { background: "#f0f9ff", border: "1px solid #e0f2fe", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#0369a1" },
  icon: { marginRight: 10, opacity: 0.7 },

  result: { textAlign: "center", paddingTop: 20 },
  checkMark: { width: 52, height: 52, borderRadius: 26, background: "#ecfdf5", color: "#16a34a", fontSize: 26, lineHeight: "52px", margin: "0 auto 14px", fontWeight: 600 },
  resultTitle: { fontSize: 20, fontWeight: 500, margin: "0 0 16px", color: "#1a1a1a" },
  donorCard: { display: "flex", justifyContent: "space-between", padding: "14px 18px", background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 10, marginBottom: 8 },
  donorName: { fontWeight: 500, color: "#1a1a1a" },
  donorEta: { color: "#16a34a", fontSize: 13 },
  resultNote: { fontSize: 13, color: "#999", marginTop: 14 },
  systemActions: { marginTop: 16, background: "#f8f9fa", border: "1px solid #e8e8e8", borderRadius: 8, padding: 14, textAlign: "left" },
  systemTitle: { fontSize: 11, fontWeight: 600, color: "#666", margin: "0 0 8px" },
  systemItem: { fontSize: 12, color: "#555", padding: "3px 0" },
  detailsToggle: { cursor: "pointer", fontSize: 12, color: "#aaa", textAlign: "left" },

  footer: { marginTop: 32 },
  dataSource: { marginTop: 28, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: 16 },
  dataSourceTitle: { fontSize: 13, fontWeight: 600, color: "#1a1a1a", cursor: "pointer" },
  dataSourceNote: { fontSize: 12, color: "#666", marginTop: 8, lineHeight: 1.6, marginBottom: 0 },

  workflow: { marginTop: 28, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, padding: 20 },
  wfTitle: { fontSize: 15, fontWeight: 600, margin: "0 0 14px", color: "#1a1a1a" },
  wfSteps: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  wfStep: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#333", padding: "6px 0" },
  wfNum: { width: 22, height: 22, borderRadius: 11, background: "#1a1a1a", color: "#fff", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  wfArrow: { color: "#ccc", fontSize: 12, paddingLeft: 6 },
  wfDisclaimer: { marginTop: 14, fontSize: 11, color: "#666", background: "#f8f9fa", padding: "10px 12px", borderRadius: 8, lineHeight: 1.6 },
  donorCta: { textAlign: "center", background: "#f8faf8", border: "1px solid #e2e8e2", borderRadius: 12, padding: "20px 16px" },
  donorCtaText: { fontSize: 14, color: "#444", margin: "0 0 10px" },
  donorBtn: { display: "inline-block", padding: "12px 28px", background: "#1a1a1a", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" },
  donorStats: { fontSize: 11, color: "#999", marginTop: 12, marginBottom: 0, lineHeight: 1.6 },
  cite: { color: "#666", textDecoration: "underline" },
  ghFooter: { textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 16, marginBottom: 0 },
  ghFooterLink: { color: "#888", textDecoration: "underline" },
  link: { color: "#555", fontSize: 13, textDecoration: "none", borderBottom: "1px solid #ddd" },
  waiting: { display: "flex", alignItems: "center", gap: 10, marginTop: 12, padding: "10px 14px", background: "#f0f9ff", borderRadius: 8, fontSize: 13, color: "#0369a1" },
  pulse: { width: 10, height: 10, borderRadius: 5, background: "#0ea5e9", animation: "pulse 1.5s infinite" },
};
