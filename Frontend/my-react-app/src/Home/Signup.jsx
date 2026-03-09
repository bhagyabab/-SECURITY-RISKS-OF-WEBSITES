import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const G = { fontFamily: "'Playfair Display', Georgia, serif" };
const B = { fontFamily: "'DM Sans', 'Segoe UI', sans-serif" };

// POST /api/auth/register         → Web User
// POST /api/auth/manager/register → Manager (stays PENDING until Admin approves)

const REGISTER_TYPES = [
  { label:"Web User",  value:"user",    icon:"👤", color:"#2563eb",
    light:"#eff6ff", border:"#bfdbfe",
    endpoint:"/api/auth/register",
    desc:"Upload & manage AES-256 encrypted files",
    successMsg:"Registration successful! Redirecting to login…" },
  { label:"Manager",   value:"manager", icon:"⚙️", color:"#d97706",
    light:"#fffbeb", border:"#fde68a",
    endpoint:"/api/auth/manager/register",
    desc:"Manage & moderate file uploads — requires Admin approval",
    successMsg:"Manager request submitted! Wait for Admin approval before logging in." },
];

export default function Signup() {
  const navigate = useNavigate();
  const [type,     setType]     = useState("user");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const active = REGISTER_TYPES.find(t => t.value === type);

  const strength = !password ? 0
    : password.length < 6   ? 1
    : password.length < 10 || !/[A-Z]/.test(password) ? 2 : 3;
  const sLabel = ["", "Weak", "Good", "Strong"];
  const sColor = ["", "#ef4444", "#f59e0b", "#059669"];

  const pwRules = [
    { ok: password.length >= 6,           label:"At least 6 characters" },
    { ok: /[A-Z]/.test(password),         label:"One uppercase letter" },
    { ok: /[0-9]/.test(password),         label:"One number" },
    { ok: /[^A-Za-z0-9]/.test(password),  label:"One special character" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim())         return setError("Name is required!");
    if (!email.trim())        return setError("Email is required!");
    if (password.length < 6)  return setError("Password must be at least 6 characters!");
    if (password !== confirm)  return setError("Passwords do not match!");

    setLoading(true);
    try {
      await axios.post(`http://localhost:8080${active.endpoint}`, {
        name:     name.trim(),
        email:    email.trim(),
        password: password,
      });

      setSuccessMsg(active.successMsg);
      setSuccess(true);

      // Web user → redirect to login after 2s
      // Manager  → redirect to login after 3s (longer so they read the approval message)
      setTimeout(() => navigate("/login"), type === "manager" ? 3500 : 2000);

    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inpStyle = (val, matchOk) => ({
    width:"100%", padding:"13px 16px 13px 46px", borderRadius:13,
    border:`2px solid ${matchOk !== undefined
      ? (val ? (matchOk ? "#6ee7b7" : "#fca5a5") : "#e2e8f0")
      : (val ? active.border : "#e2e8f0")}`,
    background:"#fff", fontSize:14, color:"#1e293b",
    fontFamily:"'DM Sans','Segoe UI',sans-serif", transition:"border .2s, box-shadow .2s",
  });

  return (
    <div style={{ ...B, minHeight:"100vh", display:"flex",
      background:"linear-gradient(145deg,#eff6ff 0%,#f8faff 45%,#ede9fe 100%)",
      position:"relative", overflow:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatBg   { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
        @keyframes successPop{ 0%{opacity:0;transform:scale(.85)} 100%{opacity:1;transform:scale(1)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        input:focus  { outline:none; }
        input::placeholder { color:#94a3b8; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#bfdbfe; border-radius:4px; }
        .type-btn {
          flex:1; padding:11px 8px; border-radius:13px; cursor:pointer;
          display:flex; flex-direction:column; align-items:center; gap:5px;
          transition:all .25s; font-family:'DM Sans','Segoe UI',sans-serif;
        }
        .type-btn:hover { transform:translateY(-2px); }
        .submit-btn {
          width:100%; padding:14px; border-radius:13px; border:none; cursor:pointer;
          font-family:'DM Sans','Segoe UI',sans-serif; font-weight:700; font-size:14px;
          color:#fff; box-shadow:0 6px 22px rgba(37,99,235,.38);
          transition:all .28s; display:flex; align-items:center; justify-content:center; gap:9px;
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 32px rgba(37,99,235,.52); }
        .submit-btn:disabled { opacity:.6; cursor:not-allowed; box-shadow:none; background:#e2e8f0; color:#94a3b8; }
      `}</style>

      {/* bg decorations */}
      <div style={{ position:"absolute", top:40, right:"3%", fontSize:160, opacity:.05,
        animation:"floatBg 9s ease-in-out infinite", userSelect:"none", pointerEvents:"none" }}>☁️</div>
      <div style={{ position:"absolute", bottom:30, left:"2%", fontSize:120, opacity:.04,
        animation:"floatBg 11s ease-in-out infinite 2s", userSelect:"none", pointerEvents:"none" }}>🔐</div>

      {/* ══ LEFT: IMAGE PANEL ══ */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:40, animation:"fadeUp 1s cubic-bezier(.22,1,.36,1) .1s both" }}>
        <div style={{ width:"100%", maxWidth:440, borderRadius:32, overflow:"hidden",
          position:"relative", boxShadow:"0 32px 80px rgba(37,99,235,.22)",
          border:"3px solid rgba(255,255,255,.92)" }}>

          <img
            src="https://tse3.mm.bing.net/th/id/OIP.VoNVXvrXPZyFtISLFBcYNQHaDV?w=1000&h=450&rs=1&pid=ImgDetMain&o=7&rm=3"
            alt="Secure Cloud"
            style={{ width:"100%", height:640, objectFit:"cover", display:"block",
              filter:"brightness(.72) saturate(1.3)" }}
          />
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to top,rgba(15,23,42,.94) 0%,rgba(37,99,235,.20) 55%,transparent 100%)" }} />

          <div style={{ position:"absolute", bottom:32, left:28, right:28 }}>

            {/* account type panel — updates live with selected type */}
            <div style={{ padding:"16px 18px", borderRadius:18,
              background:"rgba(255,255,255,.12)", backdropFilter:"blur(12px)",
              border:"1.5px solid rgba(255,255,255,.22)", marginBottom:14 }}>
              <div style={{ fontSize:10, letterSpacing:2, color:"rgba(255,255,255,.55)",
                fontWeight:700, marginBottom:8, ...B }}>CREATING ACCOUNT AS</div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12,
                  background: type === "manager"
                    ? "linear-gradient(135deg,#d97706,#f59e0b)"
                    : "linear-gradient(135deg,#2563eb,#7c3aed)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
                  {active.icon}
                </div>
                <div>
                  <div style={{ fontSize:17, fontWeight:800, color:"#fff", ...G }}>{active.label}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.65)", ...B }}>{active.desc}</div>
                </div>
              </div>
            </div>

            {/* Manager approval notice */}
            {type === "manager" && (
              <div style={{ padding:"12px 16px", borderRadius:14, marginBottom:14,
                background:"rgba(217,119,6,.22)", backdropFilter:"blur(8px)",
                border:"1.5px solid rgba(251,191,36,.40)" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#fde68a", marginBottom:4, ...B }}>
                  ⏳ PENDING APPROVAL
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.7)", lineHeight:1.6, ...B }}>
                  After registering, an Admin must approve your account before you can log in.
                </div>
              </div>
            )}

            {/* name preview */}
            <div style={{ padding:"12px 16px", borderRadius:14, marginBottom:14,
              background: name ? "rgba(37,99,235,.22)" : "rgba(255,255,255,.08)",
              backdropFilter:"blur(8px)",
              border:`1.5px solid ${name ? "rgba(96,165,250,.50)" : "rgba(255,255,255,.15)"}`,
              display:"flex", alignItems:"center", gap:10, transition:"all .4s" }}>
              <span style={{ fontSize:18 }}>👤</span>
              <div>
                <div style={{ fontSize:10, letterSpacing:1.5,
                  color:"rgba(255,255,255,.55)", fontWeight:700, ...B }}>YOUR NAME</div>
                <div style={{ fontSize:14, fontWeight:700,
                  color: name ? "#93c5fd" : "rgba(255,255,255,.35)", ...G }}>
                  {name || "Not entered yet"}
                </div>
              </div>
            </div>

            {/* feature pills */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {(type === "manager"
                ? ["Approve Files","Reject Files","View Users","File Monitoring","JWT Protected"]
                : ["Upload Files","AES-256 Encrypted","AWS S3 Storage","Owner-Only Access","JWT Protected"]
              ).map((f, i) => (
                <div key={i} style={{ padding:"5px 11px", borderRadius:20,
                  background:"rgba(96,165,250,.22)", border:"1px solid rgba(96,165,250,.38)",
                  fontSize:11, color:"#93c5fd", fontWeight:700, ...B }}>✓ {f}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT: FORM PANEL ══ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"32px 64px 32px 44px", maxWidth:540, overflowY:"auto",
        animation:"fadeUp .8s cubic-bezier(.22,1,.36,1) both" }}>

        {/* Logo */}
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:10,
          textDecoration:"none", marginBottom:32 }}>
          <div style={{ width:40, height:40, borderRadius:12,
            background:"linear-gradient(135deg,#2563eb,#7c3aed)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20, boxShadow:"0 4px 14px rgba(37,99,235,.38)" }}>🔐</div>
          <span style={{ fontSize:19, fontWeight:900, color:"#0f172a", ...G }}>
            Cloud<span style={{ color:"#2563eb" }}>Secure</span>
          </span>
        </Link>

        <div style={{ fontSize:11, letterSpacing:2.5, color:active.color,
          fontWeight:700, marginBottom:8, ...B }}>CREATE ACCOUNT</div>
        <h1 style={{ fontSize:30, fontWeight:900, color:"#0f172a",
          lineHeight:1.1, marginBottom:6, ...G }}>
          Join <span style={{ color:active.color, fontStyle:"italic" }}>CloudSecure</span> today
        </h1>
        <p style={{ fontSize:14, color:"#64748b", marginBottom:20, ...B }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color:active.color, fontWeight:700, textDecoration:"none" }}>
            Sign in →
          </Link>
        </p>

        {/* ── Register Type Selector ── */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, letterSpacing:1.5, color:"#94a3b8",
            fontWeight:700, marginBottom:9, ...B }}>REGISTER AS</div>
          <div style={{ display:"flex", gap:10 }}>
            {REGISTER_TYPES.map(t => (
              <button key={t.value} type="button" className="type-btn"
                onClick={() => { setType(t.value); setError(""); }}
                style={{
                  border:`2px solid ${type === t.value ? t.color : "#e2e8f0"}`,
                  background: type === t.value ? t.light : "#fff",
                  boxShadow: type === t.value ? `0 4px 16px ${t.color}28` : "none",
                }}>
                <span style={{ fontSize:22 }}>{t.icon}</span>
                <span style={{ fontSize:12, fontWeight:700,
                  color: type === t.value ? t.color : "#64748b", ...B }}>{t.label}</span>
                {type === t.value && (
                  <span style={{ fontSize:10, color:t.color, fontWeight:700, ...B }}>Selected ✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Manager approval warning */}
        {type === "manager" && (
          <div style={{ padding:"10px 14px", borderRadius:12, marginBottom:16,
            background:"#fffbeb", border:"1.5px solid #fde68a",
            display:"flex", alignItems:"flex-start", gap:9 }}>
            <span style={{ fontSize:14, flexShrink:0 }}>⏳</span>
            <span style={{ fontSize:12, color:"#92400e", lineHeight:1.65, ...B }}>
              Your manager registration will be <strong>PENDING</strong> until an Admin approves it.
              You cannot log in until approved.
            </span>
          </div>
        )}

        {/* ── Success state ── */}
        {success ? (
          <div style={{ padding:"32px", borderRadius:22,
            background: type === "manager" ? "#fffbeb" : "#eff6ff",
            border:`2px solid ${type === "manager" ? "#fde68a" : "#bfdbfe"}`,
            textAlign:"center",
            animation:"successPop .5s cubic-bezier(.22,1,.36,1) both" }}>
            <div style={{ fontSize:56, marginBottom:14 }}>
              {type === "manager" ? "⏳" : "🎉"}
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:active.color,
              marginBottom:8, ...G }}>
              {type === "manager" ? "Request Submitted!" : "Registration Successful!"}
            </div>
            <div style={{ fontSize:14, color:"#475569", marginBottom:6, ...B }}>
              {type === "manager"
                ? `Welcome, ${name}! Your account is pending Admin approval.`
                : `Welcome to CloudSecure, ${name}!`}
            </div>
            <div style={{ fontSize:13, color:"#94a3b8", ...B }}>
              Redirecting to login…
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:13 }}>

            {/* Name */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"#475569",
                letterSpacing:1, marginBottom:6, display:"block", ...B }}>FULL NAME *</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:15, top:"50%",
                  transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>👤</span>
                <input type="text" placeholder="John Doe"
                  style={inpStyle(name)}
                  value={name} onChange={e => setName(e.target.value)}
                  onFocus={e => { e.target.style.borderColor=active.color; e.target.style.boxShadow=`0 0 0 3px ${active.color}14`; }}
                  onBlur={e  => { e.target.style.borderColor=name?active.border:"#e2e8f0"; e.target.style.boxShadow="none"; }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:"#475569",
                letterSpacing:1, marginBottom:6, display:"block", ...B }}>EMAIL ADDRESS *</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:15, top:"50%",
                  transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>📧</span>
                <input type="email" placeholder="you@example.com"
                  style={inpStyle(email)}
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  onFocus={e => { e.target.style.borderColor=active.color; e.target.style.boxShadow=`0 0 0 3px ${active.color}14`; }}
                  onBlur={e  => { e.target.style.borderColor=email?active.border:"#e2e8f0"; e.target.style.boxShadow="none"; }}
                />
              </div>
            </div>

            {/* Password + Confirm */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#475569",
                  letterSpacing:1, marginBottom:6, display:"block", ...B }}>PASSWORD *</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:15, top:"50%",
                    transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>🔒</span>
                  <input type={showPw ? "text" : "password"} placeholder="Min 6 chars"
                    style={{ ...inpStyle(password), paddingRight:42 }}
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    onFocus={e => { e.target.style.borderColor=active.color; e.target.style.boxShadow=`0 0 0 3px ${active.color}14`; }}
                    onBlur={e  => { e.target.style.borderColor=password?active.border:"#e2e8f0"; e.target.style.boxShadow="none"; }}
                  />
                  <span onClick={() => setShowPw(p => !p)}
                    style={{ position:"absolute", right:12, top:"50%",
                      transform:"translateY(-50%)", cursor:"pointer",
                      fontSize:13, userSelect:"none" }}>
                    {showPw ? "🙈" : "👁️"}
                  </span>
                </div>
                {password && (
                  <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{ flex:1, height:3, borderRadius:2,
                      background:"#e2e8f0", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:2, transition:"all .3s",
                        width:`${(strength/3)*100}%`, background:sColor[strength] }} />
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:sColor[strength], ...B }}>
                      {sLabel[strength]}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize:11, fontWeight:700, color:"#475569",
                  letterSpacing:1, marginBottom:6, display:"block", ...B }}>CONFIRM *</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:15, top:"50%",
                    transform:"translateY(-50%)", fontSize:14, pointerEvents:"none" }}>✅</span>
                  <input type={showPw ? "text" : "password"} placeholder="Repeat password"
                    style={inpStyle(confirm, confirm ? confirm === password : undefined)}
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    onFocus={e => { e.target.style.borderColor=confirm===password?"#059669":"#ef4444"; e.target.style.boxShadow=`0 0 0 3px ${active.color}12`; }}
                    onBlur={e  => { e.target.style.borderColor=confirm?(confirm===password?"#6ee7b7":"#fca5a5"):"#e2e8f0"; e.target.style.boxShadow="none"; }}
                  />
                </div>
                {confirm && (
                  <div style={{ marginTop:6, fontSize:11, fontWeight:700,
                    color: confirm === password ? "#059669" : "#ef4444", ...B }}>
                    {confirm === password ? "✓ Passwords match" : "✕ Does not match"}
                  </div>
                )}
              </div>
            </div>

            {/* password rules */}
            {password && (
              <div style={{ background:"#f8faff", border:"1px solid #e2e8f0",
                borderRadius:12, padding:"11px 14px",
                display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 14px" }}>
                {pwRules.map((r, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center",
                    gap:6, fontSize:12, ...B }}>
                    <span style={{ color: r.ok ? "#22c55e" : "#cbd5e1", fontSize:13 }}>
                      {r.ok ? "✓" : "○"}
                    </span>
                    <span style={{ color: r.ok ? "#374151" : "#94a3b8",
                      fontWeight: r.ok ? 600 : 400 }}>{r.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* error */}
            {error && (
              <div style={{ padding:"11px 15px", borderRadius:11, background:"#fef2f2",
                border:"1.5px solid #fca5a5", fontSize:13, color:"#ef4444",
                fontWeight:600, ...B }}>⚠️ {error}</div>
            )}

            {/* submit */}
            <button type="submit" className="submit-btn" disabled={loading}
              style={{ marginTop:2,
                background: loading ? undefined : `linear-gradient(135deg,${active.color},${active.color}bb)`,
                boxShadow: `0 6px 22px ${active.color}38`
              }}>
              {loading ? (
                <>
                  <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.35)",
                    borderTop:"2px solid #fff", borderRadius:"50%",
                    animation:"spin .7s linear infinite", display:"inline-block" }} />
                  Creating Account…
                </>
              ) : `Register as ${active.label} ${active.icon}`}
            </button>
          </form>
        )}

        {/* admin note */}
        <div style={{ marginTop:16, padding:"10px 14px", background:"#eff6ff",
          border:"1.5px solid #bfdbfe", borderRadius:12,
          display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:15 }}>🛡️</span>
          <span style={{ fontSize:12, color:"#3b82f6", ...B }}>
            Are you the admin?{" "}
            <Link to="/login" style={{ color:"#2563eb", fontWeight:700, textDecoration:"none" }}>
              Login directly
            </Link>{" "}
            — no registration needed.
          </span>
        </div>
      </div>
    </div>
  );
}