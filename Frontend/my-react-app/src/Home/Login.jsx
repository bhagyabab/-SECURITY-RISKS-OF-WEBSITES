import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const G   = { fontFamily: "'Playfair Display', Georgia, serif" };
const B   = { fontFamily: "'DM Sans', 'Segoe UI', sans-serif" };
const API = "http://localhost:8080";

// All 3 roles hit the SAME endpoint: POST /api/auth/login
// Backend checks: admin email → manager table → user table
const ROLES = [
  { label:"Administrator", value:"admin",   icon:"🛡️", color:"#2563eb",
    light:"#eff6ff", border:"#bfdbfe",
    hint:"Pre-configured admin credentials — no registration required.",
    placeholder:"admin@gmail.com" },
  { label:"Manager",       value:"manager", icon:"⚙️", color:"#d97706",
    light:"#fffbeb", border:"#fde68a",
    hint:"Manager accounts require Admin approval before first login.",
    placeholder:"manager@example.com" },
  { label:"Web User",      value:"user",    icon:"👤", color:"#059669",
    light:"#ecfdf5", border:"#6ee7b7",
    hint:"Sign in with the email and password you registered with.",
    placeholder:"you@example.com" },
];

export default function Login() {
  const navigate = useNavigate();
  const [role,     setRole]     = useState("user");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const active = ROLES.find(r => r.value === role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim())    return setError("Email is required!");
    if (!password.trim()) return setError("Password is required!");

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/auth/login`, {
        email:    email.trim(),
        password: password,
      });

      // Store in sessionStorage — consistent across all pages
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role",  data.role);
      sessionStorage.setItem("name",  data.name);
      sessionStorage.setItem("email", data.email);

      setSuccess(data.message);
      setTimeout(() => {
        if      (data.role === "ADMIN")   navigate("/admin/dashboard");
        else if (data.role === "MANAGER") navigate("/manager/dashboard");
        else                              navigate("/user/dashboard");
      }, 800);

    } catch (err) {
      const status = err?.response?.status;
      const msg    = err?.response?.data?.error;
      // 403 = Manager PENDING or REJECTED
      if      (status === 403) setError(msg || "Access denied. Your account may be pending Admin approval.");
      else if (status === 401) setError(msg || "Invalid credentials. Please try again.");
      else if (status === 400) setError(msg || "Please fill in all fields.");
      else                     setError("Cannot connect to server. Make sure Spring Boot is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...B, minHeight:"100vh", display:"flex",
      background:"linear-gradient(145deg,#eff6ff 0%,#f8faff 45%,#ede9fe 100%)",
      position:"relative", overflow:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatBg { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.7)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        input:focus  { outline:none; }
        input::placeholder { color:#94a3b8; }
        .inp {
          width:100%; padding:13px 16px 13px 46px; border-radius:13px;
          border:2px solid #e2e8f0; background:#fff; font-size:14px; color:#1e293b;
          font-family:'DM Sans','Segoe UI',sans-serif; transition:border .2s, box-shadow .2s;
        }
        .role-btn {
          flex:1; padding:10px 6px; border-radius:14px; cursor:pointer;
          display:flex; flex-direction:column; align-items:center; gap:4px;
          transition:all .25s; font-family:'DM Sans','Segoe UI',sans-serif;
          border:2px solid #e2e8f0; background:#fff;
        }
        .role-btn:hover { transform:translateY(-2px); }
        .submit-btn {
          width:100%; padding:14px; border-radius:13px; border:none; cursor:pointer;
          font-family:'DM Sans','Segoe UI',sans-serif; font-weight:700; font-size:14px;
          color:#fff; transition:all .28s; display:flex; align-items:center;
          justify-content:center; gap:9px;
        }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); }
        .submit-btn:disabled { opacity:.6; cursor:not-allowed; }
      `}</style>

      {/* floating bg */}
      <div style={{ position:"absolute", top:50, left:"3%", fontSize:170, opacity:.05,
        animation:"floatBg 9s ease-in-out infinite", userSelect:"none", pointerEvents:"none" }}>🔐</div>
      <div style={{ position:"absolute", bottom:30, right:"3%", fontSize:130, opacity:.04,
        animation:"floatBg 11s ease-in-out infinite 2s", userSelect:"none", pointerEvents:"none" }}>☁️</div>

      {/* ══ LEFT: FORM ══ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"50px 60px", maxWidth:540,
        animation:"fadeUp .8s cubic-bezier(.22,1,.36,1) both" }}>

        {/* Logo */}
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:10,
          textDecoration:"none", marginBottom:36 }}>
          <div style={{ width:42, height:42, borderRadius:13,
            background:"linear-gradient(135deg,#2563eb,#7c3aed)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, boxShadow:"0 4px 16px rgba(37,99,235,.38)" }}>🔐</div>
          <span style={{ fontSize:20, fontWeight:900, color:"#0f172a", ...G }}>
            Cloud<span style={{ color:"#2563eb" }}>Secure</span>
          </span>
        </Link>

        <div style={{ fontSize:11, letterSpacing:2.5, color:active.color,
          fontWeight:700, marginBottom:8, ...B }}>WELCOME BACK</div>

        <h1 style={{ fontSize:32, fontWeight:900, color:"#0f172a",
          lineHeight:1.1, marginBottom:8, ...G }}>
          Sign in to your<br />
          <span style={{ color:active.color, fontStyle:"italic" }}>account</span>
        </h1>

        <p style={{ fontSize:14, color:"#64748b", marginBottom:24, ...B }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color:active.color, fontWeight:700, textDecoration:"none" }}>
            Register here →
          </Link>
        </p>

        {/* ── Role Selector — 3 tabs ── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, letterSpacing:1.5, color:"#94a3b8",
            fontWeight:700, marginBottom:9, ...B }}>LOGIN AS</div>
          <div style={{ display:"flex", gap:8 }}>
            {ROLES.map(r => (
              <button key={r.value} type="button" className="role-btn"
                onClick={() => { setRole(r.value); setError(""); setEmail(""); setPassword(""); }}
                style={{
                  border:`2px solid ${role === r.value ? r.color : "#e2e8f0"}`,
                  background: role === r.value ? r.light : "#fff",
                  boxShadow: role === r.value ? `0 4px 16px ${r.color}28` : "none",
                }}>
                <span style={{ fontSize:20 }}>{r.icon}</span>
                <span style={{ fontSize:11, fontWeight:700,
                  color: role === r.value ? r.color : "#64748b", ...B }}>{r.label}</span>
                {role === r.value && (
                  <span style={{ fontSize:9, color:r.color, fontWeight:700, ...B }}>Selected ✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Role hint */}
        <div style={{ padding:"9px 13px", borderRadius:11, marginBottom:16,
          background:active.light, border:`1.5px solid ${active.border}`,
          display:"flex", alignItems:"center", gap:9 }}>
          <span style={{ fontSize:14 }}>{active.icon}</span>
          <span style={{ fontSize:12, color:active.color, fontWeight:600, lineHeight:1.5, ...B }}>
            {active.hint}
          </span>
        </div>

        {/* Manager — extra note with register link */}
        {role === "manager" && (
          <div style={{ padding:"9px 13px", borderRadius:11, marginBottom:14,
            background:"#fffbeb", border:"1.5px solid #fde68a",
            display:"flex", alignItems:"flex-start", gap:9 }}>
            <span style={{ fontSize:14, flexShrink:0 }}>⏳</span>
            <span style={{ fontSize:12, color:"#92400e", lineHeight:1.65, ...B }}>
              New manager?{" "}
              <Link to="/signup" style={{ color:"#d97706", fontWeight:700, textDecoration:"none" }}>
                Register as Manager →
              </Link>
              {" "}Your account needs Admin approval before you can log in.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Email */}
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"#475569",
              letterSpacing:1, marginBottom:7, display:"block", ...B }}>EMAIL ADDRESS</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:15, top:"50%",
                transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>📧</span>
              <input type="email" className="inp"
                placeholder={active.placeholder}
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                onFocus={e => { e.target.style.borderColor=active.color; e.target.style.boxShadow=`0 0 0 3px ${active.color}18`; }}
                onBlur={e  => { e.target.style.borderColor=email?active.border:"#e2e8f0"; e.target.style.boxShadow="none"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"#475569",
              letterSpacing:1, marginBottom:7, display:"block", ...B }}>PASSWORD</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:15, top:"50%",
                transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>🔒</span>
              <input type={showPw ? "text" : "password"} className="inp"
                style={{ paddingRight:46 }}
                placeholder="Enter your password"
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                onFocus={e => { e.target.style.borderColor=active.color; e.target.style.boxShadow=`0 0 0 3px ${active.color}18`; }}
                onBlur={e  => { e.target.style.borderColor=password?active.border:"#e2e8f0"; e.target.style.boxShadow="none"; }}
              />
              <span onClick={() => setShowPw(p => !p)}
                style={{ position:"absolute", right:14, top:"50%",
                  transform:"translateY(-50%)", cursor:"pointer", fontSize:15, userSelect:"none" }}>
                {showPw ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{ padding:"11px 15px", borderRadius:11, background:"#fef2f2",
              border:"1.5px solid #fca5a5", fontSize:13, color:"#ef4444",
              fontWeight:600, display:"flex", alignItems:"center", gap:7, ...B }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ padding:"11px 15px", borderRadius:11, background:"#f0fdf4",
              border:"1.5px solid #86efac", fontSize:13, color:"#16a34a",
              fontWeight:600, display:"flex", alignItems:"center", gap:7, ...B }}>
              ✅ {success}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="submit-btn" disabled={loading} style={{
            background: loading ? "#e2e8f0" : `linear-gradient(135deg,${active.color},${active.color}cc)`,
            color: loading ? "#94a3b8" : "#fff",
            boxShadow: loading ? "none" : `0 6px 22px ${active.color}40`,
          }}>
            {loading ? (
              <>
                <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.35)",
                  borderTop:"2px solid #fff", borderRadius:"50%",
                  animation:"spin .7s linear infinite", display:"inline-block" }} />
                Signing in…
              </>
            ) : `Sign In as ${active.label} ${active.icon}`}
          </button>
        </form>

        <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #f1f5f9",
          textAlign:"center", fontSize:12, color:"#94a3b8", ...B }}>
          Admin account does not require registration
        </div>
      </div>

      {/* ══ RIGHT: IMAGE PANEL ══ */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:40, animation:"fadeUp 1s cubic-bezier(.22,1,.36,1) .15s both" }}>
        <div style={{ width:"100%", maxWidth:480, borderRadius:32, overflow:"hidden",
          position:"relative", boxShadow:"0 32px 80px rgba(37,99,235,.24)",
          border:"3px solid rgba(255,255,255,.92)" }}>

          <img
            src="https://www.newsoftwares.net/blog/wp-content/uploads/2024/01/Future-Trends-in-Cloud-Data-Storage-Security.png"
            alt="Cloud Security"
            style={{ width:"100%", height:570, objectFit:"cover", display:"block",
              filter:"brightness(.75) saturate(1.2)" }}
          />
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(to top,rgba(15,23,42,.94) 0%,rgba(37,99,235,.15) 55%,transparent 100%)" }} />

          <div style={{ position:"absolute", bottom:36, left:32, right:32 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8,
              padding:"7px 16px", borderRadius:50, marginBottom:20,
              background:"rgba(255,255,255,.12)", backdropFilter:"blur(10px)",
              border:"1.5px solid rgba(255,255,255,.22)" }}>
              <span style={{ width:8, height:8, borderRadius:"50%",
                background: active.value==="admin" ? "#60a5fa" : active.value==="manager" ? "#fbbf24" : "#4ade80",
                animation:"pulse 2s infinite", display:"inline-block" }} />
              <span style={{ fontSize:12, color:"#fff", fontWeight:700, ...B }}>
                Signing in as {active.label}
              </span>
            </div>

            <div style={{ fontSize:22, fontWeight:900, color:"#fff",
              marginBottom:10, lineHeight:1.35, ...G }}>
              "Security is not a product,<br />but a process."
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.60)",
              fontWeight:600, marginBottom:22, ...B }}>— Bruce Schneier</div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{ v:"AES-256", l:"File Encryption" }, { v:"JWT", l:"Auth Guard" },
                { v:"3 Roles", l:"Access Control" },  { v:"AWS S3", l:"Secure Storage" }
              ].map((s, i) => (
                <div key={i} style={{ padding:"10px 14px", borderRadius:12,
                  background:"rgba(255,255,255,.10)", backdropFilter:"blur(8px)",
                  border:"1px solid rgba(255,255,255,.18)" }}>
                  <div style={{ fontSize:15, fontWeight:900, color:"#fff", ...G }}>{s.v}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", fontWeight:600, ...B }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}