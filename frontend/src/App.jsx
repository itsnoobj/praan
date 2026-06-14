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
    if (!SR) return;
    const r = new SR();
    r.lang = "hi-IN";
    r.interimResults = true;
    r.onstart = () => setIsListening(true);
    r.onresult = (e) => setMessage(Array.from(e.results).map(r => r[0].transcript).join(""));
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
                  placeholder={"e.g. Need 2 units O+ blood at Fortis Bannerghatta, father in surgery after accident\n\nThe more details you share (reason, units needed, hospital), the faster donors respond."}
                  rows={5}
                  style={s.textarea}
                />
                <button
                  type="button"
                  onClick={startVoice}
                  style={{ ...s.mic, background: isListening ? "#ef4444" : "#1a1a1a", color: "#fff" }}
                >
                  {isListening ? "⏹ Stop" : "🎤 Speak"}
                </button>
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

              <p style={s.trust}>No signup · Pay ₹299 only if donor arrives · No donor = ₹0</p>
            </form>

            <footer style={s.footer}>
              <a href="#donor" style={s.donorBtn}>Become a donor → See benefits</a>
              <p style={s.donorStats}>
                <a href="https://timesofindia.indiatimes.com/life-style/health-fitness/health-news/blood-donation-are-you-eligible-to-donate-blood-all-about-the-rules-of-blood-donation/articleshow/117388629.cms" target="_blank" rel="noopener" style={s.cite}>12,000 lives lost daily</a> due to blood shortage · <a href="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0265951" target="_blank" rel="noopener" style={s.cite}>14.6M units needed/year</a> · 1 donation saves up to 3 lives
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
                  {ev.message || ev.type}
                </div>
              ))}
              {events.length > 0 && events[events.length - 1]?.type === "call_initiated" && (
                <div style={s.waiting}>
                  <div style={s.pulse} />
                  <span>Call in progress — waiting for donor's response...</span>
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
            <p style={s.resultNote}>Details sent to your WhatsApp.</p>
            <details style={{ marginTop: 20 }}>
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
  page: { minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  container: { width: "100%", maxWidth: 780, fontFamily: "'Inter', -apple-system, system-ui, sans-serif", color: "#1a1a1a" },

  header: { textAlign: "center", marginBottom: 28 },
  brand: { fontSize: 34, fontWeight: 700, margin: 0, color: "#1a1a1a", letterSpacing: "-1px" },
  tagline: { fontSize: 14, color: "#888", marginTop: 6 },

  stats: { display: "flex", justifyContent: "center", gap: 8, fontSize: 12, color: "#999", marginBottom: 24, flexWrap: "wrap" },
  statDot: { color: "#ddd" },

  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { position: "relative" },
  textarea: { width: "100%", padding: 18, paddingRight: 60, border: "1px solid #e0e0e0", borderRadius: 12, fontSize: 15, fontFamily: "inherit", resize: "none", boxSizing: "border-box", background: "#fff", color: "#1a1a1a", lineHeight: 1.6 },
  mic: { position: "absolute", right: 12, bottom: 12, padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  input: { padding: 16, border: "1px solid #e0e0e0", borderRadius: 12, fontSize: 15, background: "#fff", color: "#1a1a1a", boxSizing: "border-box" },
  btn: { padding: 16, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  trust: { textAlign: "center", fontSize: 12, color: "#999", margin: 0 },

  feedWrap: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 14, padding: 20 },
  feedTitle: { margin: "0 0 14px", fontSize: 15, fontWeight: 500, color: "#333" },
  feed: { maxHeight: 360, overflowY: "auto", fontSize: 13, lineHeight: 2.0 },
  event: { color: "#555" },
  icon: { marginRight: 10, opacity: 0.7 },

  result: { textAlign: "center", paddingTop: 20 },
  checkMark: { width: 52, height: 52, borderRadius: 26, background: "#ecfdf5", color: "#16a34a", fontSize: 26, lineHeight: "52px", margin: "0 auto 14px", fontWeight: 600 },
  resultTitle: { fontSize: 20, fontWeight: 500, margin: "0 0 16px", color: "#1a1a1a" },
  donorCard: { display: "flex", justifyContent: "space-between", padding: "14px 18px", background: "#f0fdf4", border: "1px solid #d1fae5", borderRadius: 10, marginBottom: 8 },
  donorName: { fontWeight: 500, color: "#1a1a1a" },
  donorEta: { color: "#16a34a", fontSize: 13 },
  resultNote: { fontSize: 13, color: "#999", marginTop: 14 },
  detailsToggle: { cursor: "pointer", fontSize: 12, color: "#aaa" },

  footer: { textAlign: "center", marginTop: 32 },
  donorBtn: { display: "block", padding: "16px 24px", background: "#f0fdf4", border: "2px solid #16a34a", borderRadius: 12, fontSize: 16, fontWeight: 600, color: "#16a34a", textDecoration: "none" },
  donorStats: { fontSize: 12, color: "#888", marginTop: 10, lineHeight: 1.6 },
  cite: { color: "#555", textDecoration: "underline" },
  link: { color: "#555", fontSize: 13, textDecoration: "none", borderBottom: "1px solid #ddd" },
  waiting: { display: "flex", alignItems: "center", gap: 10, marginTop: 12, padding: "10px 14px", background: "#f0f9ff", borderRadius: 8, fontSize: 13, color: "#0369a1" },
  pulse: { width: 10, height: 10, borderRadius: 5, background: "#0ea5e9", animation: "pulse 1.5s infinite" },
};
