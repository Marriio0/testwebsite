import { useState, useEffect, useRef, createContext, useContext } from 'react';

const API = import.meta.env.VITE_API_URL || "https://lumpiness-numeric-enviable.ngrok-free.dev/api";
const AuthCtx = createContext(null);
const DarkCtx = createContext({ dark: false, toggleDark: () => {} });
const useDark = () => useContext(DarkCtx);

const useAuth = () => useContext(AuthCtx);

// ── GLOBAL ANIMATIONS ─────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideRight {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    @keyframes countUp {
      from { opacity: 0; transform: scale(0.7); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 6px currentColor; }
      50% { box-shadow: 0 0 14px currentColor; }
    }
    @keyframes gradientShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes float1 {
      0%, 100% { transform: translate(0, 0); }
      50%       { transform: translate(20px, -30px); }
    }
    @keyframes float2 {
      0%, 100% { transform: translate(0, 0); }
      50%       { transform: translate(-25px, 20px); }
    }
    @keyframes float3 {
      0%, 100% { transform: translate(0, 0); }
      50%       { transform: translate(15px, 25px); }
    }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      from { background-position: 0% center; }
      to   { background-position: 200% center; }
    }
    .auth-left-enter  { animation: fadeSlideIn 0.6s ease both; }
    .auth-form-enter  { animation: fadeSlideIn 0.6s 0.15s ease both; }
    .card-enter { animation: fadeUp 0.4s ease both; }
    .card-enter:nth-child(1) { animation-delay: 0.05s; }
    .card-enter:nth-child(2) { animation-delay: 0.1s; }
    .card-enter:nth-child(3) { animation-delay: 0.15s; }
    .card-enter:nth-child(4) { animation-delay: 0.2s; }
    .card-enter:nth-child(5) { animation-delay: 0.25s; }
    .card-enter:nth-child(6) { animation-delay: 0.3s; }
    .rapport-card { animation: fadeUp 0.35s ease both; }
    .rapport-card:nth-child(1) { animation-delay: 0.1s; }
    .rapport-card:nth-child(2) { animation-delay: 0.18s; }
    .rapport-card:nth-child(3) { animation-delay: 0.26s; }
    .rapport-card:nth-child(4) { animation-delay: 0.34s; }
    .rapport-card:nth-child(5) { animation-delay: 0.42s; }
    .rapport-card:nth-child(6) { animation-delay: 0.5s; }
    * { box-sizing: border-box; }
  `}</style>
);

// ── ANIMATED COUNTER ──────────────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const duration = 600;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span style={{ animation: "countUp 0.4s ease both" }}>{display}</span>;
};

const api = async (path, opts = {}, token = null) => {
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
  const text = await res.text();
  console.log(`API ${opts.method || "GET"} ${path} →`, res.status, text.slice(0, 200));
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Réponse non-JSON (${res.status}): ${text.slice(0, 100)}`); }
  if (!res.ok) throw data;
  return data;
};

const STATUT_CONFIG = {
  soumis:        { label: "Soumis",        color: "#178ce8", bg: "#e6f1fb" },
  en_correction: { label: "En correction", color: "#BA7517", bg: "#FAEEDA" },
  resoumis:      { label: "Resoumis",      color: "#534AB7", bg: "#EEEDFE" },
  valide:        { label: "Validé",        color: "#3B6D11", bg: "#EAF3DE" },
  refuse:        { label: "Refusé",        color: "#A32D2D", bg: "#FCEBEB" },
};

const Badge = ({ statut }) => {
  const cfg = STATUT_CONFIG[statut] || { label: statut, color: "#888", bg: "#f0f0f0" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, letterSpacing: 0.3 }}>
      {cfg.label}
    </span>
  );
};

const Avatar = ({ name, size = 36, color = "#178ce8", bg = "#e6f1fb" }) => {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
    <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#178ce8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const colors = { success: ["#EAF3DE", "#3B6D11"], error: ["#FCEBEB", "#A32D2D"], info: ["#e6f1fb", "#0C447C"] };
  const [bg, text] = colors[type] || colors.info;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: bg, color: text, fontWeight: 500, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10, maxWidth: 380, animation: "slideUp 0.3s ease" }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: text, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#888", lineHeight: 1, padding: "0 4px" }}>×</button>
      </div>
      <div style={{ padding: "20px 24px 24px" }}>{children}</div>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#fafafa", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", ...props.style }} onFocus={e => e.target.style.borderColor = "#178ce8"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
);

const Textarea = ({ ...props }) => (
  <textarea {...props} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#fafafa", outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box", fontFamily: "inherit", ...props.style }} onFocus={e => e.target.style.borderColor = "#178ce8"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
);

const Select = ({ children, ...props }) => (
  <select {...props} style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#fafafa", outline: "none", appearance: "none", boxSizing: "border-box", ...props.style }}>{children}</select>
);

const Btn = ({ variant = "primary", children, style, ...props }) => {
  const styles = {
    primary: { background: "#178ce8", color: "#fff", border: "none" },
    secondary: { background: "#f8fafc", color: "#374151", border: "1.5px solid #e2e8f0" },
    danger: { background: "#FCEBEB", color: "#A32D2D", border: "none" },
    success: { background: "#EAF3DE", color: "#3B6D11", border: "none" },
  };
  return (
    <button {...props} style={{ padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s", ...styles[variant], ...style }}>
      {children}
    </button>
  );
};

// ── LOGIN / REGISTER ──────────────────────────────────────────────────
const ROLES_INFO = {
  etudiant:  { icon: "🎓", label: "Étudiant",  color: "#3b82f6", bg: "#eff6ff" },
  encadrant: { icon: "👨", label: "Encadrant", color: "#10b981", bg: "#ecfdf5" },
  jury:      { icon: "⚖",  label: "Jury",      color: "#8b5cf6", bg: "#f5f3ff" },
};

// BUG FIX 2: AUTH_STYLES was used but never defined
const AUTH_STYLES = `
  .auth-left-enter { animation: fadeSlideIn 0.6s ease both; }
  .auth-form-enter { animation: fadeSlideIn 0.6s 0.15s ease both; }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes float1 {
    0%, 100% { transform: translate(0, 0); }
    50%       { transform: translate(20px, -30px); }
  }
  @keyframes float2 {
    0%, 100% { transform: translate(0, 0); }
    50%       { transform: translate(-25px, 20px); }
  }
  @keyframes float3 {
    0%, 100% { transform: translate(0, 0); }
    50%       { transform: translate(15px, 25px); }
  }
  @keyframes shimmer {
    from { background-position: 0% center; }
    to   { background-position: 200% center; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  
  @media (max-width: 768px) {
    .auth-left-enter {
      flex: 1 1 100% !important;
      height: auto !important;
      min-height: 300px;
      padding: 40px 24px !important;
      position: relative !important;
    }
    
    .auth-form-enter {
      flex: 1 1 100% !important;
      min-height: auto !important;
      padding: 32px 20px !important;
      width: 100% !important;
    }
    
    h2 {
      font-size: 24px !important;
    }
    
    p {
      font-size: 13px !important;
    }
  }
`;

const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nom: "", email: "", password: "", password_confirmation: "", role: "etudiant", invite_code: "", cne: "", filiere: "", niveau: "", grade: "", departement: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [pendingMsg, setPendingMsg] = useState("");
  const [filiereOptions, setFiliereOptions] = useState([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("pfe_token") || "";
    const headers = { "Accept": "application/json", "ngrok-skip-browser-warning": "1" };
    if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;
    fetch(`${API}/filieres`, { headers })
      .then(async r => {
        const text = await r.text();
        try {
          const data = JSON.parse(text);
          const list = Array.isArray(data) ? data.map(f => f.nom) : [];
          setFiliereOptions(list);
        } catch(e) {
          console.error("Filieres parse error:", text.substring(0, 200));
        }
      })
      .catch(err => console.error("Filieres fetch error:", err));
  }, []);

  // BUG FIX 3 & 4: was useState (wrong hook) and `mounted` was unused anyway
  // Removed entirely since it served no purpose

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setErr(""); setLoading(true);
    try {
      const endpoint = mode === "login" ? "/login" : "/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "1" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 403 && data.status === "pending") {
        setPendingMsg(data.message || "Votre compte est en attente d'approbation.");
        return;
      }
      if (res.status === 403 && data.status === "rejected") {
        setErr("Votre compte a été refusé. Contactez l'administrateur.");
        return;
      }
      if (!res.ok) {
        setErr(data?.message || Object.values(data?.errors || {})[0]?.[0] || "Erreur");
        return;
      }
      if (mode === "register") {
        // Compte créé → afficher message pending
        setPendingMsg(data.message || "Compte créé. En attente d'approbation.");
        return;
      }
      onLogin(data.user, data.token);
    } catch (e) {
      setErr(e?.message === "Failed to fetch" ? "Impossible de contacter le serveur — vérifiez que le backend est démarré." : (e?.message || "Erreur réseau"));
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const inp = (extra = {}) => ({
    style: {
      width: "100%", padding: "12px 14px", border: "1.5px solid #e2e8f0",
      borderRadius: 10, fontSize: 14, color: "#0f172a", background: "#fff",
      outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
      fontFamily: "inherit", ...extra
    },
    onFocus: e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; },
    onBlur:  e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; },
  });

  const lbl = (text) => (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{text}</label>
  );

  // BUG FIX 1: JSX structure was completely broken — left panel and right panel
  // were nested incorrectly. Fixed: both panels are direct children of the outer flex div.
  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", alignItems: "flex-start", flexWrap: "wrap", "@media (max-width: 768px)": { flexDirection: "column" } }}>
      <style>{AUTH_STYLES}</style>

      {/* ── LEFT: branding panel ── */}
      <div className="auth-left-enter" style={{ flex: "1 1 50%", background: "linear-gradient(-45deg, #0f0c29, #302b63, #1a1a4e, #0d1b4b)", backgroundSize: "400% 400%", animation: "gradientShift 8s ease infinite", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px", position: "sticky", top: 0, height: "100vh", overflow: "hidden", minWidth: 0, "@media (max-width: 768px)": { flex: "1 1 100%", height: "auto", minHeight: "300px", padding: "40px 24px", position: "relative" } }}>

        {/* subtle grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

        {/* animated glow blobs */}
        <div style={{ position: "absolute", top: "15%", left: "25%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)", pointerEvents: "none", animation: "float1 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "15%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", pointerEvents: "none", animation: "float2 11s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "55%", left: "10%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)", pointerEvents: "none", animation: "float3 7s ease-in-out infinite" }} />

        {/* floating particles */}
        {[
          { top: "12%", left: "18%", size: 6, delay: "0s", dur: "4s" },
          { top: "35%", left: "8%",  size: 4, delay: "1s", dur: "5s" },
          { top: "70%", left: "22%", size: 5, delay: "2s", dur: "6s" },
          { top: "20%", left: "78%", size: 4, delay: "0.5s", dur: "5s" },
          { top: "60%", left: "85%", size: 6, delay: "1.5s", dur: "4s" },
          { top: "85%", left: "60%", size: 3, delay: "3s", dur: "7s" },
          { top: "45%", left: "92%", size: 5, delay: "2.5s", dur: "5s" },
        ].map((p, i) => (
          <div key={i} style={{ position: "absolute", top: p.top, left: p.left, width: p.size, height: p.size, borderRadius: "50%", background: i % 2 === 0 ? "#818cf8" : "#c084fc", opacity: 0.5, animation: `pulse ${p.dur} ${p.delay} ease-in-out infinite`, pointerEvents: "none" }} />
        ))}

        {/* rotating rings */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(99,102,241,0.07)", animation: "spin 30s linear infinite", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 380, height: 380, borderRadius: "50%", border: "1px solid rgba(139,92,246,0.06)", animation: "spin 20s linear infinite reverse", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 380, width: "100%" }}>

          {/* logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48, animation: "fadeSlideIn 0.6s 0.1s both" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L22 8.5V15.5L12 21L2 15.5V8.5L12 3Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M12 3V21M2 8.5L12 14L22 8.5" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -0.4 }}>PFE Manager</p>
              <p style={{ margin: 0, fontSize: 12, color: "#818cf8" }}>Plateforme académique</p>
            </div>
          </div>

          <h2 style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: -0.8, animation: "fadeSlideIn 0.6s 0.2s both" }}>
            Gérez vos projets<br />
            <span style={{ background: "linear-gradient(90deg, #818cf8, #c084fc, #818cf8)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 3s linear infinite" }}>de fin d'études</span>
          </h2>
          <p style={{ margin: "0 0 44px", fontSize: 14, color: "#64748b", lineHeight: 1.7, animation: "fadeSlideIn 0.6s 0.3s both" }}>
            Soumission, suivi, validation — tout centralisé sur une seule plateforme sécurisée.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Dépôt et versioning des rapports",      color: "#6366f1", delay: "0.4s" },
              { label: "Feedback des encadrants en temps réel", color: "#8b5cf6", delay: "0.5s" },
              { label: "Décisions officielles du jury",          color: "#a78bfa", delay: "0.6s" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", animation: `fadeSlideIn 0.5s ${f.delay} both`, transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: f.color, flexShrink: 0, boxShadow: `0 0 8px ${f.color}` }} />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── RIGHT: form panel ── */}
      {/* BUG FIX 1: This was incorrectly nested inside the left panel's content div */}
      <div className="auth-form-enter" style={{ flex: "1 1 50%", background: "#fafafa", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "52px 44px", overflowY: "auto", minHeight: "100vh", minWidth: 0, "@media (max-width: 768px)": { flex: "1 1 100%", minHeight: "auto", padding: "32px 20px", width: "100%" } }}>

        <div style={{ marginBottom: 36 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1 }}>
            {mode === "login" ? "Connexion" : "Inscription"}
          </p>
          <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>
            {mode === "login" ? "Bon retour" : "Créer un compte"}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
            {mode === "login" ? "Connectez-vous à votre espace." : "Complétez le formulaire pour rejoindre la plateforme."}
          </p>
        </div>

        {/* ── PENDING SCREEN ── */}
        {pendingMsg && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fffbeb", border: "2px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 30 }}>⏳</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>En attente d'approbation</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{pendingMsg}</p>
            <button onClick={() => { setPendingMsg(""); setMode("login"); }}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Retour à la connexion
            </button>
          </div>
        )}

        {!pendingMsg && (
        <div>
        {err && (
          <div style={{ padding: "11px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 20, fontSize: 13, color: "#b91c1c", fontWeight: 500, animation: "fadeSlideIn 0.3s both" }}>
            {err}
          </div>
        )}

        {mode === "register" && (
          <div style={{ marginBottom: 16 }}>
            {lbl("Nom complet")}
            <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Prénom Nom" {...inp()} />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          {lbl("Adresse email")}
          <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="vous@example.com" onKeyDown={handleKey} {...inp()} />
        </div>

        <div style={{ marginBottom: mode === "register" ? 16 : 24 }}>
          {lbl("Mot de passe")}
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" onKeyDown={handleKey} {...inp({ paddingRight: 44 })} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13, fontWeight: 600, padding: 0 }}>
              {showPass ? "Cacher" : "Voir"}
            </button>
          </div>
        </div>

        {mode === "register" && (<>
          <div style={{ marginBottom: 16 }}>
            {lbl("Confirmer le mot de passe")}
            <input type="password" value={form.password_confirmation} onChange={e => set("password_confirmation", e.target.value)} placeholder="••••••••" {...inp()} />
          </div>

          <div style={{ marginBottom: 16 }}>
            {lbl("Rôle")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {Object.entries(ROLES_INFO).map(([role, info]) => (
                <button key={role} onClick={() => set("role", role)} style={{ padding: "12px 6px", borderRadius: 10, border: `1.5px solid ${form.role === role ? info.color : "#e2e8f0"}`, background: form.role === role ? info.bg : "#fff", cursor: "pointer", transition: "all 0.18s", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{info.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: form.role === role ? info.color : "#94a3b8" }}>{info.label}</div>
                </button>
              ))}
            </div>
          </div>

          {(form.role === "encadrant" || form.role === "jury") && (
          <div style={{ marginBottom: 16 }}>
            {lbl("Code d'invitation *")}
            <div style={{ position: "relative" }}>
              <input
                value={form.invite_code}
                onChange={e => set("invite_code", e.target.value.toUpperCase())}
                placeholder="ex: ABCD-EFGH-IJKL"
                maxLength={14}
                {...inp({ fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" })}
              />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔑</span>
            </div>
            <p style={{ margin: "5px 0 0", fontSize: 11, color: "#94a3b8" }}>Demandez ce code à l'administrateur avant de vous inscrire.</p>
          </div>
          )}

                    {form.role === "etudiant" && (
            <div style={{ padding: 16, background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe", marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                {lbl("CNE")}
                <input value={form.cne} onChange={e => set("cne", e.target.value)} placeholder="N12345678" {...inp()} />
              </div>
              <div style={{ marginBottom: 12 }}>
                {lbl("Filière")}
                {filiereOptions.length > 0 && form.filiere !== "__other__" ? (
                  <select
                    value={form.filiere}
                    onChange={e => set("filiere", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: form.filiere ? "#0f172a" : "#94a3b8", background: "#fafafa", outline: "none", appearance: "none", cursor: "pointer", boxSizing: "border-box" }}
                  >
                    <option value="">— Sélectionner votre filière —</option>
                    {filiereOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={form.filiere === "__other__" ? "" : form.filiere} onChange={e => set("filiere", e.target.value)} placeholder="Saisir votre filière..." {...inp({ flex: 1 })} />
                    {filiereOptions.length > 0 && (
                      <button type="button" onClick={() => set("filiere", "")}
                        style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#64748b", whiteSpace: "nowrap" }}>
                        ← Liste
                      </button>
                    )}
                  </div>
                )}
                {filiereOptions.length === 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#f59e0b" }}>⚠ Aucune filière définie — contactez l'administrateur.</p>
                )}
              </div>
              <div>
                {lbl("Niveau")}
                <input value={form.niveau} onChange={e => set("niveau", e.target.value)} placeholder="Master 2" {...inp()} />
              </div>
            </div>
          )}

          {form.role === "encadrant" && (
            <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", marginBottom: 16 }}>
              {[["grade","Grade","Professeur"],["departement","Département","Informatique"]].map(([k,l,p]) => (
                <div key={k} style={{ marginBottom: k==="departement" ? 0 : 12 }}>
                  {lbl(l)}
                  <input value={form[k]} onChange={e => set(k, e.target.value)} placeholder={p} {...inp()} />
                </div>
              ))}
            </div>
          )}
        </>)}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: loading ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", transition: "opacity 0.2s", boxShadow: "0 6px 20px rgba(99,102,241,0.3)", letterSpacing: 0.2 }}>
          {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer le compte"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: 12, color: "#cbd5e1" }}>ou</span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}>
          {mode === "login" ? "Créer un nouveau compte" : "J'ai déjà un compte"}
        </button>
        </div>
        )}

        <p style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#cbd5e1" }}>© 2026 PFE Manager</p>
      </div>
    </div>
  );
};


// ── RAPPORT CARD ──────────────────────────────────────────────────────
const RapportCard = ({ rapport, onClick }) => {
  const dateStr = rapport.date_depot ? new Date(rapport.date_depot).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const cfg = STATUT_CONFIG[rapport.statut] || {};
  return (
    <div onClick={onClick}
      style={{ background: D.card, border: `1.5px solid ${D.border}`, borderRadius: 16, padding: "20px", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 14 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(99,102,241,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: D.text, lineHeight: 1.4, flex: 1 }}>{rapport.titre}</h3>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${cfg.color}22` }}>
          {cfg.label}
        </span>
      </div>

      {rapport.description && (
        <p style={{ margin: 0, fontSize: 13, color: D.sub, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {rapport.description}
        </p>
      )}

      <div style={{ height: 1, background: "#f1f5f9" }} />

      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#94a3b8", flexWrap: "wrap" }}>
        {rapport.etudiant && (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#3b82f6" strokeWidth="2.5"/><circle cx="12" cy="7" r="4" stroke="#3b82f6" strokeWidth="2.5"/></svg>
            </div>
            <span style={{ color: "#374151", fontWeight: 600 }}>{rapport.etudiant.nom}</span>
          </span>
        )}
        {rapport.encadrant && (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#10b981" strokeWidth="2.5"/><circle cx="12" cy="7" r="4" stroke="#10b981" strokeWidth="2.5"/></svg>
            </div>
            <span style={{ color: "#374151", fontWeight: 600 }}>{rapport.encadrant.nom}</span>
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#94a3b8" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
          {dateStr}
        </span>
        {rapport.versions?.length > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "#f5f3ff", borderRadius: 10, color: "#8b5cf6", fontWeight: 700 }}>
            v{rapport.versions.length}
          </span>
        )}
        {rapport.verified_by_encadrant && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "#f0fdf4", borderRadius: 10, color: "#16a34a", fontWeight: 700, border: "1px solid #bbf7d0" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Vérifié
          </span>
        )}
        {rapport.commentaires?.length > 0 && (
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#94a3b8" strokeWidth="2"/></svg>
            {rapport.commentaires.length}
          </span>
        )}
      </div>
    </div>
  );
};

// ── RAPPORT DETAIL MODAL ──────────────────────────────────────────────
const ROLE_COLORS = {
  etudiant:  { text: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  encadrant: { text: "#15803d", bg: "#dcfce7", border: "#86efac" },
  jury:      { text: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  admin:     { text: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
};

const RapportDetail = ({ rapport: initialRapport, onClose, onUpdate, toast }) => {
  const { user, token } = useAuth();
  const [rapport, setRapport] = useState(initialRapport);
  const [commentaire, setCommentaire] = useState("");
  const [newStatut, setNewStatut] = useState(initialRapport.statut);
  const [loadingComment, setLoadingComment] = useState(false);
  const [loadingStatut, setLoadingStatut] = useState(false);
  const [loadingVal, setLoadingVal] = useState(null);

  const canComment  = ["encadrant", "jury", "admin"].includes(user.role);
  const canValidate = ["jury", "admin"].includes(user.role);
  const canStatut   = ["jury", "admin"].includes(user.role);

  const refresh = async () => {
    try {
      const [commentaires, validations] = await Promise.all([
        api(`/rapports/${rapport.id}/commentaires`, {}, token),
        api(`/rapports/${rapport.id}/validations`, {}, token),
      ]);
      setRapport(r => ({
        ...r,
        commentaires: Array.isArray(commentaires) ? commentaires : [],
        validations: Array.isArray(validations?.validations) ? validations.validations : (Array.isArray(validations) ? validations : []),
      }));
      onUpdate();
    } catch {}
  };

  const sendComment = async () => {
    const txt = commentaire.trim();
    if (!txt) return;
    setLoadingComment(true);
    try {
      await api(`/rapports/${rapport.id}/commentaires`, {
        method: "POST",
        body: JSON.stringify({ contenu: txt, type: "feedback" }),
      }, token);
      setCommentaire("");
      await refresh();
    } catch (e) { console.error("COMMENT ERROR:", e); toast(e?.message || "Erreur envoi", "error"); }
    finally { setLoadingComment(false); }
  };

  const applyStatut = async () => {
    setLoadingStatut(true);
    try {
      await api(`/rapports/${rapport.id}`, { method: "PUT", body: JSON.stringify({ statut: newStatut }) }, token);
      toast("Statut mis à jour", "success");
      await refresh();
    } catch { toast("Erreur", "error"); }
    finally { setLoadingStatut(false); }
  };

  const decide = async (decision) => {
    setLoadingVal(decision);
    try {
      await api(`/rapports/${rapport.id}/validations`, { method: "POST", body: JSON.stringify({ decision }) }, token);
      toast(decision === "valide" ? "Rapport validé ✓" : "Rapport refusé", decision === "valide" ? "success" : "error");
      await refresh();
    } catch (e) { toast(e?.message || "Erreur", "error"); }
    finally { setLoadingVal(null); }
  };

  const commentaires = rapport.commentaires || [];
  const validations  = rapport.validations  || [];
  const lastVer      = rapport.versions?.[rapport.versions.length - 1];
  const dateStr      = rapport.date_depot
    ? new Date(rapport.date_depot).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const statCfg = STATUT_CONFIG[rapport.statut] || {};

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 24, width: "100%", maxWidth: 620, maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,0.3)" }}>

        {/* ── TOP BAND ── */}
        <div style={{ background: "#0f172a", padding: "20px 24px 18px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: statCfg.bg, color: statCfg.color, letterSpacing: 0.4 }}>{statCfg.label || rapport.statut}</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>📅 {dateStr}</span>
                {rapport.verified_by_encadrant && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    Vérifié
                  </span>
                )}
                {lastVer && (
                  <a href={lastVer.file_url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "#38bdf8", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    📄 Rapport PDF v{rapport.versions.length}
                  </a>
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f8fafc", lineHeight: 1.3 }}>{rapport.titre}</h2>
            </div>
            <button onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            {rapport.etudiant && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, fontSize: 10, color: "#60a5fa", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Étudiant</p>
                <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{rapport.etudiant.nom}</p>
                {rapport.etudiant.filiere && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{rapport.etudiant.filiere} · {rapport.etudiant.niveau}</p>}
              </div>
            )}
            {rapport.encadrant && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, fontSize: 10, color: "#4ade80", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Encadrant</p>
                <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{rapport.encadrant.nom}</p>
                {rapport.encadrant.grade && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{rapport.encadrant.grade}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>

          {rapport.description && (
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#475569", lineHeight: 1.8, padding: "12px 16px", background: "#f8fafc", borderRadius: 12, borderLeft: "3px solid #e2e8f0" }}>
              {rapport.description}
            </p>
          )}

          {/* ENCADRANT: vérification - uniquement si assigné à ce rapport */}
          {user.role === "encadrant" && rapport.encadrant_id === user.id && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Vérification encadrant</p>
              <button
                onClick={async () => {
                  try {
                    await api(`/rapports/${rapport.id}`, {
                      method: "PUT",
                      body: JSON.stringify({ verified_by_encadrant: !rapport.verified_by_encadrant }),
                    }, token);
                    toast(rapport.verified_by_encadrant ? "Vérification annulée" : "Rapport vérifié ✓", "success");
                    await refresh();
                  } catch { toast("Erreur", "error"); }
                }}
                style={{
                  width: "100%", padding: "13px 16px", borderRadius: 12,
                  border: `2px solid ${rapport.verified_by_encadrant ? "#22c55e" : "#e2e8f0"}`,
                  background: rapport.verified_by_encadrant ? "#f0fdf4" : "#fff",
                  color: rapport.verified_by_encadrant ? "#16a34a" : "#64748b",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "all 0.2s",
                }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: rapport.verified_by_encadrant ? "#22c55e" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke={rapport.verified_by_encadrant ? "white" : "#94a3b8"} strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                {rapport.verified_by_encadrant ? "Rapport vérifié — Cliquer pour annuler" : "Marquer comme vérifié"}
              </button>
              {rapport.verified_at && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#16a34a", textAlign: "right" }}>
                  Vérifié le {new Date(rapport.verified_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          )}

          {/* DÉCISION — dropdown unifié */}
          {(canValidate || canStatut) && (
            <div style={{ marginBottom: 20, padding: "16px 18px", background: "#f8fafc", borderRadius: 14, border: "1.5px solid #ede9fe" }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Décision</p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <select value={newStatut} onChange={e => setNewStatut(e.target.value)}
                    style={{ width: "100%", padding: "10px 36px 10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#0f172a", background: "#fff", outline: "none", appearance: "none", cursor: "pointer", boxSizing: "border-box" }}>
                    {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8", fontSize: 12 }}>▼</span>
                </div>
                <button onClick={applyStatut} disabled={loadingStatut || newStatut === rapport.statut}
                  style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: newStatut !== rapport.statut ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#e2e8f0", color: newStatut !== rapport.statut ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 13, cursor: newStatut !== rapport.statut ? "pointer" : "default", transition: "all 0.2s", whiteSpace: "nowrap", boxShadow: newStatut !== rapport.statut ? "0 4px 12px rgba(99,102,241,0.3)" : "none" }}>
                  {loadingStatut ? "..." : "Appliquer"}
                </button>
              </div>
            </div>
          )}

          {/* VALIDATIONS */}
          {validations.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Historique validations ({validations.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {validations.map(v => {
                  const ok = v.decision === "valide";
                  const no = v.decision === "refuse";
                  const c  = ok ? { bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e", text: "#15803d", label: "Validé" }
                              : no ? { bg: "#fff5f5", border: "#fecaca", dot: "#ef4444", text: "#b91c1c", label: "Refusé" }
                              : { bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", text: "#92400e", label: "En attente" };
                  return (
                    <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: c.bg, border: `1px solid ${c.border}` }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{c.label}</span>
                      {v.user && <span style={{ fontSize: 12, color: "#64748b" }}>par <b style={{ color: "#374151" }}>{v.user.nom}</b></span>}
                      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>{v.date_decision ? new Date(v.date_decision).toLocaleDateString("fr-FR") : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* COMMENTAIRES */}
          <div>
            <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
              Commentaires {commentaires.length > 0 && `(${commentaires.length})`}
            </p>

            {commentaires.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: 14, marginBottom: 14, border: "1.5px dashed #e2e8f0" }}>
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Pas encore de commentaires</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {commentaires.map(c => {
                  const isMe = c.user?.id === user.id;
                  const rc = ROLE_COLORS[c.user?.role] || { text: "#374151", bg: "#f1f5f9", border: "#e2e8f0" };
                  return (
                    <div key={c.id} style={{ display: "flex", gap: 10, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: rc.bg, border: `2px solid ${rc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: rc.text, flexShrink: 0 }}>
                        {c.user?.nom?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div style={{ maxWidth: "75%" }}>
                        <p style={{ margin: isMe ? "0 4px 4px 0" : "0 0 4px 4px", fontSize: 11, color: "#94a3b8", textAlign: isMe ? "right" : "left" }}>
                          <b style={{ color: "#374151" }}>{c.user?.nom}</b>
                          <span style={{ margin: "0 6px", fontSize: 10, padding: "1px 6px", borderRadius: 10, background: rc.bg, color: rc.text }}>{c.user?.role}</span>
                        </p>
                        <div style={{ background: isMe ? "#0f172a" : "#f1f5f9", borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding: "10px 14px" }}>
                          <p style={{ margin: 0, fontSize: 13, color: isMe ? "#e2e8f0" : "#0f172a", lineHeight: 1.6 }}>{c.contenu}</p>
                        </div>
                        <p style={{ margin: isMe ? "4px 4px 0 0" : "4px 0 0 4px", fontSize: 10, color: "#cbd5e1", textAlign: isMe ? "right" : "left" }}>
                          {c.created_at ? new Date(c.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* BUG FIX 5: Comment input only shown for roles that can comment */}
            {canComment && (
              <>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#f8fafc", borderRadius: 16, padding: "10px 12px 10px 14px", border: "1.5px solid #e2e8f0" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#f8fafc", flexShrink: 0 }}>
                    {user.nom?.charAt(0).toUpperCase()}
                  </div>
                  <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendComment(); }}
                    placeholder="Écrire un commentaire..." rows={2}
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#0f172a", resize: "none", fontFamily: "inherit", lineHeight: 1.5, paddingTop: 4 }}
                  />
                  <button onClick={sendComment} disabled={loadingComment || !commentaire.trim()}
                    style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: commentaire.trim() ? "#178ce8" : "#e2e8f0", color: "#fff", cursor: commentaire.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, transition: "all 0.2s", flexShrink: 0 }}>
                    {loadingComment ? "·" : "↑"}
                  </button>
                </div>
                <p style={{ margin: "5px 0 0", fontSize: 10, color: "#cbd5e1", textAlign: "right" }}>Ctrl + Entrée pour envoyer</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// ── NOUVEAU RAPPORT ───────────────────────────────────────────────────
const NewRapportModal = ({ onClose, onCreated, toast }) => {
  const { token } = useAuth();
  const [form, setForm] = useState({ titre: "", description: "", encadrant_id: "" });
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [encadrants, setEncadrants] = useState([]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api("/encadrants", {}, token)
      .then(data => setEncadrants(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") { toast("Uniquement les fichiers PDF sont acceptés", "error"); return; }
    if (f.size > 20 * 1024 * 1024) { toast("Fichier trop lourd (max 20 Mo)", "error"); return; }
    setFile(f);
  };

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setUploadProgress(0);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API}/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setUploading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data.file_url);
          else reject(data);
        } catch { reject({ message: "Erreur serveur" }); }
      };
      xhr.onerror = () => { setUploading(false); reject({ message: "Erreur réseau" }); };
      xhr.send(formData);
    });
  };

  const submit = async () => {
    if (!form.titre) { toast("Le titre est requis", "error"); return; }
    if (!file) { toast("Veuillez sélectionner un fichier PDF", "error"); return; }
    setLoading(true);
    try {
      const file_url = await uploadFile();
      await api("/rapports", { method: "POST", body: JSON.stringify({ ...form, file_url, encadrant_id: form.encadrant_id || undefined }) }, token);
      toast("Rapport soumis avec succès! 🎉", "success");
      onCreated();
    } catch (e) {
      toast(e?.message || Object.values(e?.errors || {})[0]?.[0] || "Erreur lors de la soumission", "error");
    } finally { setLoading(false); setUploading(false); }
  };

  const formatSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

  return (
    <Modal title="Soumettre un rapport" onClose={onClose}>
      <Field label="Titre du rapport *">
        <Input value={form.titre} onChange={e => set("titre", e.target.value)} placeholder="Ex: Développement d'une application web..." />
      </Field>
      <Field label="Description">
        <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Décrivez votre projet..." />
      </Field>

      <Field label="Fichier PDF *">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById("pdf-upload-input").click()}
          style={{
            border: `2px dashed ${dragOver ? "#178ce8" : file ? "#3B6D11" : "#d1d9e6"}`,
            borderRadius: 12, padding: "24px 16px", textAlign: "center", cursor: "pointer",
            background: dragOver ? "#e6f1fb" : file ? "#EAF3DE" : "#fafbfc", transition: "all 0.2s",
          }}
        >
          <input id="pdf-upload-input" type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          {file ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{file.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#3B6D11" }}>{formatSize(file.size)} · PDF</p>
              </div>
              <button onClick={e => { e.stopPropagation(); setFile(null); setUploadProgress(0); }}
                style={{ marginLeft: "auto", background: "#FCEBEB", border: "none", borderRadius: 6, color: "#A32D2D", cursor: "pointer", padding: "4px 10px", fontSize: 13, fontWeight: 600 }}>
                Changer
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#374151" }}>
                {dragOver ? "Déposez le fichier ici" : "Cliquez ou glissez-déposez votre PDF"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>PDF uniquement · Max 20 Mo</p>
            </div>
          )}
        </div>

        {(uploading || uploadProgress > 0) && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
                {uploading ? "Envoi en cours..." : "Fichier envoyé ✓"}
              </span>
              <span style={{ fontSize: 12, color: "#178ce8", fontWeight: 700 }}>{uploadProgress}%</span>
            </div>
            <div style={{ height: 6, background: "#e2e8f0", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${uploadProgress}%`, background: uploadProgress === 100 ? "#3B6D11" : "#178ce8", borderRadius: 10, transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}
      </Field>

      <Field label="Encadrant (optionnel)">
        <select
          value={form.encadrant_id}
          onChange={e => set("encadrant_id", e.target.value)}
          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: form.encadrant_id ? "#0f172a" : "#94a3b8", background: "#fafafa", outline: "none", appearance: "none", boxSizing: "border-box", cursor: "pointer" }}
        >
          <option value="">— Sélectionner un encadrant —</option>
          {encadrants.map(e => (
            <option key={e.id} value={e.id}>
              {e.nom}{e.grade ? ` · ${e.grade}` : ""}{e.departement ? ` · ${e.departement}` : ""}
            </option>
          ))}
        </select>
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose} disabled={loading || uploading}>Annuler</Btn>
        <Btn variant="primary" onClick={submit} disabled={loading || uploading}>
          {uploading ? `Envoi... ${uploadProgress}%` : loading ? "Traitement..." : "Soumettre le rapport"}
        </Btn>
      </div>
    </Modal>
  );
};

// ── ADMIN PANEL ───────────────────────────────────────────────────────

// ── FiliereSelect: dropdown depuis /api/filieres ──
const FiliereSelect = ({ value, onChange, role, token }) => {
  const [filieres, setFilieres] = useState([]);
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    api("/filieres", {}, token)
      .then(data => setFilieres(Array.isArray(data) ? data.map(f => f.nom) : []))
      .catch(() => {});
  }, []);

  const isCustom = value && !filieres.includes(value);

  return (
    <div>
      {!custom && !isCustom ? (
        <select
          value={value}
          onChange={e => {
            if (e.target.value === "__custom__") { setCustom(true); onChange(""); }
            else onChange(e.target.value);
          }}
          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: value ? "#0f172a" : "#94a3b8", background: "#fafafa", outline: "none", appearance: "none", cursor: "pointer", boxSizing: "border-box" }}
        >
          <option value="">— Sélectionner une filière —</option>
          {filieres.map(f => <option key={f} value={f}>{f}</option>)}
          <option value="__custom__">+ Saisir manuellement...</option>
        </select>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Nom de la filière..."
            autoFocus
            style={{ flex: 1, padding: "9px 12px", border: "1.5px solid #6366f1", borderRadius: 8, fontSize: 14, color: "#0f172a", background: "#fafafa", outline: "none" }}
          />
          {filieres.length > 0 && (
            <button onClick={() => { setCustom(false); onChange(""); }}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
              ← Liste
            </button>
          )}
        </div>
      )}
      <p style={{ margin: "5px 0 0", fontSize: 11, color: "#94a3b8" }}>
        {role === "jury" ? "Le jury ne verra que les rapports de cette filière." : "L'encadrant sera visible pour les étudiants de cette filière."}
      </p>
    </div>
  );
};

const AdminPanel = ({ toast }) => {
  const { token } = useAuth();
  const [adminTab, setAdminTab] = useState("users"); // "users" | "pending" | "codes" | "filieres"
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [newFiliereName, setNewFiliereName] = useState("");
  const [newFiliereDesc, setNewFiliereDesc] = useState("");
  const [addingFiliere, setAddingFiliere] = useState(false);
  const [assigningJury, setAssigningJury] = useState(null); // filiere object
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [editFiliere, setEditFiliere] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [newCodeRole, setNewCodeRole] = useState("encadrant");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [filieresList, setFilieresList] = useState([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [allUsers, pending, codes, filieresData] = await Promise.all([
        api("/users", {}, token),
        api("/users/pending", {}, token),
        api("/invite-codes", {}, token),
        api("/filieres", {}, token),
      ]);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setPendingUsers(Array.isArray(pending) ? pending : []);
      setInviteCodes(Array.isArray(codes) ? codes : []);
      setFilieresList(Array.isArray(filieresData) ? filieresData : []);
    } catch { toast("Erreur chargement", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const approveUser = async (u) => {
    try {
      await api(`/users/${u.id}/approve`, { method: "POST" }, token);
      toast(`${u.nom} approuvé ✓`, "success");
      loadUsers();
    } catch { toast("Erreur", "error"); }
  };

  const rejectUser = async (u) => {
    try {
      await api(`/users/${u.id}/reject`, { method: "POST" }, token);
      toast(`${u.nom} refusé`, "info");
      loadUsers();
    } catch { toast("Erreur", "error"); }
  };

  const generateCode = async () => {
    setGeneratingCode(true);
    try {
      await api("/invite-codes", { method: "POST", body: JSON.stringify({ role: newCodeRole }) }, token);
      toast("Code généré ✓", "success");
      loadUsers();
    } catch { toast("Erreur génération", "error"); }
    finally { setGeneratingCode(false); }
  };

  const deleteCode = async (id) => {
    try {
      await api(`/invite-codes/${id}`, { method: "DELETE" }, token);
      toast("Code supprimé", "success");
      loadUsers();
    } catch { toast("Erreur", "error"); }
  };

  const deleteUser = async (id) => {
    try {
      await api(`/users/${id}`, { method: "DELETE" }, token);
      toast("Utilisateur supprimé", "success");
      setConfirmDelete(null);
      loadUsers();
    } catch { toast("Erreur suppression", "error"); }
  };

  const addFiliere = async () => {
    if (!newFiliereName.trim()) return;
    setAddingFiliere(true);
    try {
      await api("/filieres", { method: "POST", body: JSON.stringify({ nom: newFiliereName.trim(), description: newFiliereDesc.trim() || null }) }, token);
      toast(`Filière "${newFiliereName}" créée ✓`, "success");
      setNewFiliereName(""); setNewFiliereDesc("");
      loadUsers();
    } catch(e) { toast(e?.message || "Erreur", "error"); }
    finally { setAddingFiliere(false); }
  };

  const deleteFiliere = async (id, nom) => {
    try {
      await api(`/filieres/${id}`, { method: "DELETE" }, token);
      toast(`Filière "${nom}" supprimée`, "success");
      loadUsers();
    } catch { toast("Erreur suppression", "error"); }
  };

  const assignJuryToFiliere = async (filiereId, juryId, filiereName) => {
    try {
      await api(`/filieres/${filiereId}/assign-jury`, { method: "POST", body: JSON.stringify({ jury_id: juryId }) }, token);
      toast("Jury assigné ✓", "success");
      setAssigningJury(null);
      loadUsers();
    } catch { toast("Erreur assignation", "error"); }
  };

  const updateRole = async () => {
    try {
      const payload = { role: newRole };
      if (newRole === "jury" || newRole === "encadrant") {
        payload.filiere = editFiliere || null;
      }
      await api(`/users/${editUser.id}`, { method: "PUT", body: JSON.stringify(payload) }, token);
      toast("Utilisateur mis à jour", "success");
      setEditUser(null);
      loadUsers();
    } catch { toast("Erreur mise à jour", "error"); }
  };

  // roleColors handled by ROLE_COLORS_MAP defined above

  const filtered = users.filter(u => {
    const matchSearch = u.nom?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = { total: users.length, etudiant: users.filter(u => u.role === "etudiant").length, encadrant: users.filter(u => u.role === "encadrant").length, jury: users.filter(u => u.role === "jury").length };

  const ROLE_COLORS_MAP = { etudiant: ["#178ce8","#e6f1fb"], encadrant: ["#3B6D11","#EAF3DE"], jury: ["#534AB7","#EEEDFE"], admin: ["#A32D2D","#FCEBEB"] };

  return (
    <div>
      {/* ── ADMIN TABS ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "2px solid #f0f0f0", paddingBottom: 0 }}>
        {[
          { key: "users",    label: "Utilisateurs",    count: users.filter(u=>u.status==="approved").length },
          { key: "pending",  label: "En attente",      count: pendingUsers.length, alert: pendingUsers.length > 0 },
          { key: "codes",    label: "Codes invitation",count: inviteCodes.filter(c=>!c.used).length },
          { key: "filieres", label: "Filières",        count: filieresList.length },
        ].map(t => (
          <button key={t.key} onClick={() => setAdminTab(t.key)} style={{
            padding: "9px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
            borderBottom: adminTab === t.key ? "2px solid #6366f1" : "2px solid transparent",
            background: "transparent", color: adminTab === t.key ? "#6366f1" : "#64748b",
            marginBottom: -2, display: "flex", alignItems: "center", gap: 8, transition: "color 0.15s",
          }}>
            {t.label}
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 20,
              background: t.alert ? "#fef3c7" : (adminTab === t.key ? "#eef2ff" : "#f1f5f9"),
              color: t.alert ? "#b45309" : (adminTab === t.key ? "#6366f1" : "#94a3b8"),
              fontWeight: 800, border: t.alert ? "1px solid #fde68a" : "none",
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: PENDING ── */}
      {adminTab === "pending" && (
        <div>
          {loading ? <div/> : pendingUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 600 }}>Aucun compte en attente</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingUsers.map(u => {
                const [rc, rbg] = ROLE_COLORS_MAP[u.role] || ["#888","#f0f0f0"];
                return (
                  <div key={u.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #fde68a", overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: "1px solid #fef9c3" }}>
                      <Avatar name={u.nom} size={44} color={rc} bg={rbg} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#0f172a" }}>{u.nom}</p>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: rbg, color: rc }}>{u.role}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>⏳ En attente</span>
                        </div>
                        <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b" }}>{u.email}</p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn variant="success" style={{ padding: "8px 18px" }} onClick={() => approveUser(u)}>✓ Approuver</Btn>
                        <Btn variant="danger"  style={{ padding: "8px 18px" }} onClick={() => rejectUser(u)}>✕ Refuser</Btn>
                      </div>
                    </div>
                    {/* Details grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 0 }}>
                      {[
                        { label: "CNE",         value: u.cne,          icon: "🪪", mono: true },
                        { label: "Filière",      value: u.filiere,      icon: "🎓" },
                        { label: "Niveau",       value: u.niveau,       icon: "📚" },
                        { label: "Grade",        value: u.grade,        icon: "🏅" },
                        { label: "Département",  value: u.departement,  icon: "🏛️" },
                        { label: "Inscrit le",   value: u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : null, icon: "📅" },
                      ].filter(f => f.value).map(f => (
                        <div key={f.label} style={{ padding: "10px 16px", borderRight: "1px solid #fef9c3", borderTop: "1px solid #fef9c3" }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{f.icon} {f.label}</p>
                          <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: f.mono ? "monospace" : "inherit" }}>{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: INVITE CODES ── */}
      {adminTab === "codes" && (
        <div>
          {/* Generate new code */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, padding: "16px 20px", background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>Générer un code pour :</p>
            <select value={newCodeRole} onChange={e => setNewCodeRole(e.target.value)}
              style={{ padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#0f172a", background: "#fafafa", outline: "none", appearance: "none", minWidth: 130 }}>
              <option value="encadrant">Encadrant</option>
              <option value="jury">Jury</option>
            </select>
            <Btn variant="primary" onClick={generateCode} disabled={generatingCode} style={{ whiteSpace: "nowrap" }}>
              {generatingCode ? "..." : "+ Générer un code"}
            </Btn>
          </div>

          {/* Codes list */}
          {loading ? <div/> : inviteCodes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
              <p>Aucun code généré</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
              {inviteCodes.map((c, i) => {
                const [rc, rbg] = ROLE_COLORS_MAP[c.role] || ["#888","#f0f0f0"];
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: i < inviteCodes.length-1 ? "1px solid #f5f7fa" : "none" }}>
                    <code style={{ flex: 1, fontSize: 15, fontWeight: 800, letterSpacing: 2, color: c.used ? "#94a3b8" : "#0f172a", fontFamily: "monospace", textDecoration: c.used ? "line-through" : "none" }}>{c.code}</code>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: rbg, color: rc }}>{c.role}</span>
                    {c.used ? (
                      <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                        Utilisé{c.used_by ? ` par ${c.used_by.nom}` : ""}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>Disponible</span>
                    )}
                    <button
                      onClick={() => { navigator.clipboard.writeText(c.code); toast("Code copié !", "success"); }}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, cursor: "pointer", color: "#374151", fontWeight: 600 }}
                      title="Copier">📋</button>
                    {!c.used && (
                      <Btn variant="danger" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => deleteCode(c.id)}>🗑</Btn>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: FILIÈRES ── */}

      {/* ── TAB: FILIERES ── */}
      {adminTab === "filieres" && (
        <div>
          {/* Header stats */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Filières disponibles</h3>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#94a3b8" }}>{filieresList.length} filière{filieresList.length !== 1 ? "s" : ""} configurée{filieresList.length !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={newFiliereName}
                onChange={e => setNewFiliereName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addFiliere()}
                placeholder="Nom de la nouvelle filière..."
                style={{ width: 280, padding: "9px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", color: "#0f172a", background: "#fafafa", transition: "border 0.15s" }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "#e2e8f0"}
              />
              <Btn variant="primary" onClick={addFiliere} disabled={addingFiliere || !newFiliereName.trim()}>
                {addingFiliere ? "..." : "+ Ajouter"}
              </Btn>
            </div>
          </div>

          {/* Filieres grid */}
          {filieresList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
              <p style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", margin: "0 0 8px" }}>Aucune filière définie</p>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Ajoutez des filières pour les assigner aux jurys et encadrants.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {filieresList.map(f => {
                const usersInFiliere = users.filter(u => u.filiere === f.nom);
                const encadrants = usersInFiliere.filter(u => u.role === "encadrant").length;
                const jurys = usersInFiliere.filter(u => u.role === "jury").length;
                const etudiants = usersInFiliere.filter(u => u.role === "etudiant").length;
                return (
                  <div key={f.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e2e8f0", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow 0.2s, border-color 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.10)"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎓</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#0f172a", lineHeight: 1.3 }}>{f.nom}</p>
                          {f.description && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{f.description}</p>}
                        </div>
                      </div>
                      <button onClick={() => deleteFiliere(f.id, f.nom)}
                        style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", color: "#ef4444", flexShrink: 0, transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff5f5"}
                        title="Supprimer">🗑</button>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#eff6ff", color: "#3b82f6" }}>👤 {etudiants} étudiant{etudiants !== 1 ? "s" : ""}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>🧑‍🏫 {encadrants} encadrant{encadrants !== 1 ? "s" : ""}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f5f3ff", color: "#7c3aed" }}>⚖️ {jurys} jury{jurys !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

{/* ── TAB: USERS ── */}
      {adminTab === "users" && <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total", val: stats.total, icon: "👥", color: "#178ce8", bg: "#e6f1fb" },
          { label: "Étudiants", val: stats.etudiant, icon: "🎓", color: "#178ce8", bg: "#e6f1fb" },
          { label: "Encadrants", val: stats.encadrant, icon: "👨", color: "#3B6D11", bg: "#EAF3DE" },
          { label: "Jury", val: stats.jury, icon: "⚖", color: "#534AB7", bg: "#EEEDFE" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f0f4fa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{s.label}</p>
                <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{s.val}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8" }}>🔍</span>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..." style={{ paddingLeft: 36 }} />
        </div>
        <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 160 }}>
          <option value="all">Tous les rôles</option>
          <option value="etudiant">Étudiant</option>
          <option value="encadrant">Encadrant</option>
          <option value="jury">Jury</option>
          <option value="admin">Admin</option>
        </Select>
        <Btn variant="primary" onClick={() => setShowAddModal(true)}>+ Ajouter un utilisateur</Btn>
      </div>

      {loading ? <Spinner /> : (
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #f0f4fa", overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
              <p style={{ fontWeight: 500 }}>Aucun utilisateur trouvé</p>
            </div>
          ) : filtered.map((u, i) => {
            const [rc, rbg] = ROLE_COLORS_MAP[u.role] || ["#888", "#f0f0f0"];
            return (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f5f7fa" : "none", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafbfc"}
                onMouseLeave={e => e.currentTarget.style.background = ""}
              >
                <Avatar name={u.nom} size={40} color={rc} bg={rbg} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{u.nom}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{u.email}</p>
                  {u.role === "etudiant" && u.filiere && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#b0b8c8" }}>{u.filiere} · {u.niveau}</p>}
                  {u.role === "encadrant" && u.departement && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#b0b8c8" }}>{u.grade} · {u.departement}</p>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: rbg, color: rc, textTransform: "capitalize", whiteSpace: "nowrap" }}>{u.role}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="secondary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => { setEditUser(u); setNewRole(u.role); setEditFiliere(u.filiere || ""); }}>✏ Rôle</Btn>
                  <Btn variant="danger" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => setConfirmDelete(u)}>🗑 Suppr.</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ marginTop: 12, fontSize: 13, color: "#94a3b8", textAlign: "right" }}>{filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}</p>

      {editUser && (
        <Modal title={`Modifier — ${editUser.nom}`} onClose={() => setEditUser(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "12px 16px", background: "#f8fafc", borderRadius: 10 }}>
            <Avatar name={editUser.nom} size={44} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{editUser.nom}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>{editUser.email}</p>
            </div>
          </div>
          <Field label="Rôle">
            <Select value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="encadrant">Encadrant</option>
              <option value="jury">Jury</option>
              <option value="admin">Admin</option>
            </Select>
          </Field>
          {(newRole === "jury" || newRole === "encadrant") && (
            <Field label="Filière assignée">
              <FiliereSelect value={editFiliere} onChange={setEditFiliere} role={newRole} token={token} />
            </Field>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setEditUser(null)}>Annuler</Btn>
            <Btn variant="primary" onClick={updateRole}>Confirmer</Btn>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Confirmer la suppression" onClose={() => setConfirmDelete(null)}>
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: "0 0 8px" }}>Supprimer <span style={{ color: "#A32D2D" }}>{confirmDelete.nom}</span> ?</p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Cette action est irréversible. Tous les rapports liés seront affectés.</p>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn variant="secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Annuler</Btn>
            <Btn variant="danger" style={{ flex: 1, background: "#A32D2D", color: "#fff" }} onClick={() => deleteUser(confirmDelete.id)}>Oui, supprimer</Btn>
          </div>
        </Modal>
      )}

      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onCreated={() => { setShowAddModal(false); loadUsers(); }} toast={toast} />}
      </div>}
    </div>
  );
};

const AddUserModal = ({ onClose, onCreated, toast }) => {
  const { token } = useAuth();
  const [form, setForm] = useState({ nom: "", email: "", password: "", password_confirmation: "", role: "etudiant", invite_code: "", cne: "", filiere: "", niveau: "", grade: "", departement: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.nom || !form.email || !form.password) { toast("Nom, email et mot de passe requis", "error"); return; }
    setLoading(true);
    try {
      await api("/register", { method: "POST", body: JSON.stringify({ ...form, password_confirmation: form.password }) }, token);
      toast("Utilisateur créé avec succès!", "success");
      onCreated();
    } catch (e) {
      toast(Object.values(e?.errors || {})[0]?.[0] || e?.message || "Erreur", "error");
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Ajouter un utilisateur" onClose={onClose}>
      <Field label="Nom complet *"><Input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Nom complet" /></Field>
      <Field label="Email *"><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" /></Field>
      <Field label="Mot de passe *"><Input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" /></Field>
      <Field label="Rôle">
        <Select value={form.role} onChange={e => set("role", e.target.value)}>
          <option value="etudiant">Étudiant</option>
          <option value="encadrant">Encadrant</option>
          <option value="jury">Jury</option>
          <option value="admin">Admin</option>
        </Select>
      </Field>
      {form.role === "etudiant" && (<>
        <Field label="CNE"><Input value={form.cne} onChange={e => set("cne", e.target.value)} placeholder="ex: N12345678" /></Field>
        <Field label="Filière"><Input value={form.filiere} onChange={e => set("filiere", e.target.value)} placeholder="ex: Informatique" /></Field>
        <Field label="Niveau"><Input value={form.niveau} onChange={e => set("niveau", e.target.value)} placeholder="ex: Master 2" /></Field>
      </>)}
      {form.role === "encadrant" && (<>
        <Field label="Grade"><Input value={form.grade} onChange={e => set("grade", e.target.value)} placeholder="ex: Professeur" /></Field>
        <Field label="Département"><Input value={form.departement} onChange={e => set("departement", e.target.value)} placeholder="ex: Informatique" /></Field>
      </>)}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Btn variant="secondary" onClick={onClose}>Annuler</Btn>
        <Btn variant="primary" onClick={submit} disabled={loading}>{loading ? "Création..." : "Créer l'utilisateur"}</Btn>
      </div>
    </Modal>
  );
};


// ── DARK TOGGLE ───────────────────────────────────────────────────────
const DarkToggle = () => {
  const { dark, toggleDark } = useDark();
  return (
    <button onClick={toggleDark} title={dark ? "Mode clair" : "Mode sombre"}
      style={{ width: 36, height: 36, borderRadius: 8, border: "1.5px solid #e2e8f0", background: dark ? "#1e293b" : "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>
      {dark
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="#fbbf24" strokeWidth="2"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      }
    </button>
  );
};

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { dark } = useDark();
  const D = {
    bg: dark ? "#0f172a" : "#f8fafc", topbar: dark ? "#1e293b" : "#fff",
    card: dark ? "#1e293b" : "#fff", border: dark ? "#334155" : "#e2e8f0",
    text: dark ? "#f1f5f9" : "#0f172a", sub: dark ? "#94a3b8" : "#64748b",
    input: dark ? "#0f172a" : "#fff", inputBorder: dark ? "#475569" : "#e2e8f0",
  };
  const [tab, setTab] = useState("rapports");
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [toast, setToast] = useState(null);

  // BUG FIX 6: Use a ref to always access fresh rapports in the onUpdate callback
  const rapportsRef = useRef([]);

  const showToast = (msg, type = "info") => setToast({ msg, type });

  const loadRapports = async () => {
    setLoading(true);
    try {
      const data = await api("/rapports", {}, token);
      setRapports(data);
      rapportsRef.current = data;
    }
    catch { showToast("Erreur de chargement", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadRapports(); }, []);

  const filtered = rapports.filter(r => {
    const matchSearch = r.titre.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === "all" || r.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const stats = {
    total: rapports.length,
    valide: rapports.filter(r => r.statut === "valide").length,
    en_correction: rapports.filter(r => r.statut === "en_correction").length,
    soumis: rapports.filter(r => r.statut === "soumis").length,
  };

  const ROLE_UI = {
    etudiant:  { color: "#3b82f6", bg: "#eff6ff", label: "Étudiant" },
    encadrant: { color: "#10b981", bg: "#ecfdf5", label: "Encadrant" },
    jury:      { color: "#8b5cf6", bg: "#f5f3ff", label: "Jury" },
    admin:     { color: "#ef4444", bg: "#fef2f2", label: "Admin" },
  };
  const ru = ROLE_UI[user.role] || { color: "#64748b", bg: "#f1f5f9", label: user.role };

  const STAT_CARDS = [
    { label: "Total", val: stats.total, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7h18M3 12h18M3 17h18" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/></svg> },
    { label: "Soumis", val: stats.soumis, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: "En correction", val: stats.en_correction, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/></svg> },
    { label: "Validés", val: stats.valide, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: D.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", animation: "fadeIn 0.3s ease" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── TOPBAR ── */}
      <div style={{ background: D.topbar, borderBottom: `1px solid ${D.border}`, padding: "0 28px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", animation: "slideDown 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3L22 8.5V15.5L12 21L2 15.5V8.5L12 3Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/><path d="M12 3V21M2 8.5L12 14L22 8.5" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: D.text, letterSpacing: -0.4 }}>PFE Manager</span>
          </div>

          <nav style={{ display: "flex", gap: 2 }}>
            {[
              { key: "rapports", label: "Rapports" },
              ...(user.role === "admin" ? [{ key: "users", label: "Utilisateurs" }] : []),
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.18s",
                background: tab === t.key ? (dark?"#312e81":"#eef2ff") : "transparent",
                color: tab === t.key ? "#6366f1" : D.sub,
              }}>{t.label}</button>
            ))}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: D.text }}>{user.nom}</p>
            <p style={{ margin: 0, fontSize: 11, color: D.sub }}>{user.email}</p>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${ru.color}, ${ru.color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>
            {user.nom?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: ru.bg, color: ru.color, border: `1px solid ${ru.color}33` }}>{ru.label}</span>
          <button onClick={logout} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${D.border}`, background: D.topbar, color: D.sub, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.sub; }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px" }}>

        {tab === "users" && user.role === "admin" ? (
          <AdminPanel toast={showToast} />
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: D.text, letterSpacing: -0.4 }}>
                  {user.role === "etudiant" ? "Mes rapports" : "Tous les rapports"}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
                  {user.role === "etudiant" && "Gérez et suivez vos soumissions"}
                  {user.role === "encadrant" && "Vos rapports assignés — consultez et donnez vos feedbacks"}
                  {user.role === "jury" && <><span>Rapports de la filière : </span><span style={{ fontWeight: 700, color: "#8b5cf6" }}>{user.filiere || "non définie"}</span> — <span style={{ color: "#64748b" }}>notation uniquement</span></>}
                  {user.role === "admin" && "Vue administrative complète"}
                </p>
              </div>
              {user.role === "etudiant" && (
                <button onClick={() => setShowNew(true)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)", transition: "opacity 0.2s" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  Soumettre un rapport
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
              {STAT_CARDS.map(s => (
                <div key={s.label} className="card-enter"
                  style={{ background: D.card, borderRadius: 16, padding: "18px 20px", border: `1.5px solid ${s.border}`, transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 30px ${s.color}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: 11, color: s.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: 32, fontWeight: 900, color: D.text, lineHeight: 1 }}>
                        <AnimatedNumber value={s.val} />
                      </p>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, border: `1.5px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.icon}
                    </div>
                  </div>
                  <div style={{ marginTop: 14, height: 4, borderRadius: 4, background: s.bg, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: s.val > 0 ? `${Math.min((s.val / Math.max(stats.total, 1)) * 100, 100)}%` : "0%", background: s.color, borderRadius: 4, transition: "width 0.8s ease", transformOrigin: "left", animation: "slideRight 0.8s ease both" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <svg style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#94a3b8" strokeWidth="2"/><path d="m21 21-4.35-4.35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un rapport..."
                  style={{ width: "100%", padding: "10px 14px 10px 40px", border: `1.5px solid ${D.inputBorder}`, borderRadius: 10, fontSize: 14, color: D.text, background: D.input, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "#6366f1"}
                  onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
              </div>
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                style={{ padding: "10px 14px", border: `1.5px solid ${D.inputBorder}`, borderRadius: 10, fontSize: 13, color: D.text, background: D.input, outline: "none", fontFamily: "inherit", cursor: "pointer", minWidth: 160 }}>
                <option value="all">Tous les statuts</option>
                {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {loading ? <Spinner /> : (
              <>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 20px" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#94a3b8" strokeWidth="2"/><path d="M14 2v6h6" stroke="#94a3b8" strokeWidth="2"/></svg>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#374151", margin: "0 0 6px" }}>Aucun rapport trouvé</p>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                      {user.role === "etudiant" ? "Soumettez votre premier rapport pour commencer." : "Aucun rapport ne correspond à votre recherche."}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 }}>
                    {filtered.map((r, i) => (
                      <div key={r.id} className="rapport-card" style={{ animationDelay: `${i * 0.08}s` }}>
                        <RapportCard rapport={r} onClick={() => setSelected(r)} />
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ marginTop: 20, fontSize: 12, color: "#cbd5e1", textAlign: "right" }}>
                  {filtered.length} rapport{filtered.length !== 1 ? "s" : ""} affiché{filtered.length !== 1 ? "s" : ""}
                </p>
              </>
            )}
          </>
        )}
      </div>

      {selected && (
        <RapportDetail
          rapport={selected}
          onClose={() => setSelected(null)}
          // BUG FIX 6: Use ref to find the updated rapport after reload instead of stale closure
          onUpdate={async () => {
            await loadRapports();
            const updated = rapportsRef.current.find(r => r.id === selected.id);
            if (updated) setSelected(updated);
          }}
          toast={showToast}
        />
      )}
      {showNew && <NewRapportModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); loadRapports(); }} toast={showToast} />}
    </div>
  );
};

// ── ROOT ──────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("pfe_user")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("pfe_token"));
  const [dark, setDark] = useState(() => localStorage.getItem("pfe_dark") === "1");
  const toggleDark = () => setDark(d => { const n = !d; localStorage.setItem("pfe_dark", n ? "1" : "0"); return n; });

  const login = (u, t) => { setUser(u); setToken(t); localStorage.setItem("pfe_user", JSON.stringify(u)); localStorage.setItem("pfe_token", t); };
  const logout = () => { setUser(null); setToken(null); localStorage.removeItem("pfe_user"); localStorage.removeItem("pfe_token"); };

  if (!user || !token) return <DarkCtx.Provider value={{ dark, toggleDark }}><AuthCtx.Provider value={{ user: null, token: null, logout }}><GlobalStyles /><AuthPage onLogin={login} /></AuthCtx.Provider></DarkCtx.Provider>;
  return <DarkCtx.Provider value={{ dark, toggleDark }}><AuthCtx.Provider value={{ user, token, logout }}><GlobalStyles /><Dashboard /></AuthCtx.Provider></DarkCtx.Provider>;
}