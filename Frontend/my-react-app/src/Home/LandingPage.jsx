import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ── tiny reveal hook (like YogaFlow's useReveal) ── */
function useReveal() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return [ref, on];
}
const Slide = ({ children, from = "bottom", delay = 0 }) => {
  const [ref, on] = useReveal();
  const tx = from === "left" ? "-56px" : from === "right" ? "56px" : "0px";
  const ty = from === "bottom" ? "44px" : "0px";
  return (
    <div ref={ref} style={{ transform: on ? "translate(0,0)" : `translate(${tx},${ty})`, opacity: on ? 1 : 0, transition: `transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms, opacity .55s ease ${delay}ms` }}>
      {children}
    </div>
  );
};

/* ── data ── */
const NAV = [{ l: "Home", id: "home" }, { l: "About", id: "about" }, { l: "Vulnerabilities", id: "vulns" }, { l: "Features", id: "features" }, { l: "Roles", id: "roles" }];

const VULNS = [
  { code: "V1", title: "Unrestricted Credential Acquisition", desc: "Credentials issued with no identity check — enables mass resource abuse and inflated cloud bills.", c: "#ef4444" },
  { code: "V2", title: "Credential Validity Flaw", desc: "Long-lived, unlimited credentials let attackers keep uploading even after account expiry.", c: "#f97316" },
  { code: "V3", title: "Unrestricted File Types & Sizes", desc: "No limits allow malicious scripts or oversized files to reach cloud storage undetected.", c: "#eab308" },
  { code: "V4", title: "File Overwriting", desc: "Tampered storage paths let attackers silently replace other users' files with malware.", c: "#8b5cf6" },
  { code: "V5", title: "File Stealing", desc: "Over-privileged credentials expose ListBucket/GetObject — every file in the bucket is at risk.", c: "#0ea5e9" },
  { code: "V6", title: "Callback Spoofing", desc: "Unverified callbacks let attackers inject fake records or trigger SSRF against the web server.", c: "#059669" },
];

const FEATS = [
  { e: "🔐", t: "AES-256 Encryption", d: "Secret key → SHA-256 → AES-256/ECB encrypts every file before it touches S3.", c: "#2563eb" },
  { e: "🛡️", t: "JWT Role Guards",     d: "BCrypt passwords + stateless JWT. Admin and user scopes fully separated.", c: "#7c3aed" },
  { e: "☁️", t: "AWS S3 Upload",       d: "Encrypted stream → databuckets12 (ap-southeast-2). Type & size enforced server-side.", c: "#0891b2" },
  { e: "⬇️", t: "Owner-Only Download", d: "Decrypt-on-demand using MySQL metadata. Only the uploading user retrieves the file.", c: "#059669" },
];

const ROLES = [
  { icon: "🛡️", title: "Administrator", tag: "PRE-CONFIGURED", color: "#2563eb", light: "#eff6ff", border: "#bfdbfe",
    note: "No registration needed — login directly with the hardcoded admin credentials.",
    items: ["View & delete all users system-wide", "Monitor and delete all uploaded files", "Approve or reject Manager registrations", "Dashboard statistics overview"],
    register: false, loginLabel: "Admin Login →", registerPath: null },
  { icon: "🗂️", title: "Manager", tag: "PENDING APPROVAL", color: "#d97706", light: "#fffbeb", border: "#fde68a",
    note: "Register as a manager and wait for Admin approval before you can log in.",
    items: ["Approve or reject user file uploads", "View all files with status filters", "Delete any file from the platform", "View all registered users (read-only)"],
    register: true, loginLabel: "Manager Login →", registerPath: "/manager/register" },
  { icon: "👤", title: "Web User", tag: "OPEN REGISTRATION", color: "#059669", light: "#f0fdf4", border: "#6ee7b7",
    note: "Register free. Every file you upload is AES-256 encrypted with your own secret key.",
    items: ["Register with name, email & password", "Upload files (AES-256 encrypted to S3)", "View & download your own files", "Delete your own files anytime"],
    register: true, loginLabel: "Login →", registerPath: "/register" },
];

/* ── component ── */
export default function LandingPage() {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [activeRole, setActiveRole] = useState(0);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 55);
      let cur = "home";
      NAV.forEach(({ id }) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.42) cur = id; });
      setActiveNav(cur);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  /* ── global styles (same pattern as reference 1) ── */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Outfit', sans-serif; background: #f0f4ff; color: #1e293b; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #93c5fd55; border-radius: 4px; }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes floatA  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
    @keyframes heroIn  { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
    @keyframes navIn   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    /* nav link underline (ref-1 style) */
    .nav-lnk { position:relative; cursor:pointer; font-size:14px; font-weight:500;
               letter-spacing:.4px; padding-bottom:4px; transition:color .25s; border:none; background:none; font-family:'Outfit',sans-serif; }
    .nav-lnk::after { content:''; position:absolute; bottom:-3px; left:0; width:0; height:2px;
                      border-radius:2px; transition:width .3s ease; }
    .dark-nav .nav-lnk { color:#475569; }
    .dark-nav .nav-lnk::after { background:#2563eb; }
    .dark-nav .nav-lnk:hover, .dark-nav .nav-lnk.act { color:#1e293b!important; font-weight:600; }
    .dark-nav .nav-lnk:hover::after, .dark-nav .nav-lnk.act::after { width:100%; }
    .light-nav .nav-lnk { color:rgba(255,255,255,.78); }
    .light-nav .nav-lnk::after { background:#93c5fd; }
    .light-nav .nav-lnk:hover, .light-nav .nav-lnk.act { color:#fff!important; }
    .light-nav .nav-lnk:hover::after, .light-nav .nav-lnk.act::after { width:100%; }
    .nav-solid { background:rgba(248,250,255,.97)!important; border-bottom:1px solid #e2e8f0!important;
                 box-shadow:0 2px 18px rgba(37,99,235,.07)!important; animation:navIn .3s ease both; }
    /* buttons */
    .btn-p { border:none; cursor:pointer; padding:12px 30px; border-radius:50px; background:linear-gradient(135deg,#2563eb,#7c3aed);
             color:#fff; font-family:'Outfit',sans-serif; font-weight:700; font-size:14px;
             box-shadow:0 6px 22px rgba(37,99,235,.35); transition:all .3s; }
    .btn-p:hover { transform:translateY(-2px); box-shadow:0 14px 34px rgba(37,99,235,.5); }
    .btn-o { cursor:pointer; padding:12px 30px; border-radius:50px; border:2px solid rgba(255,255,255,.5);
             background:rgba(255,255,255,.1); backdrop-filter:blur(8px); color:#fff;
             font-family:'Outfit',sans-serif; font-weight:600; font-size:14px; transition:all .3s; }
    .btn-o:hover { background:rgba(255,255,255,.22); transform:translateY(-2px); }
    /* cards */
    .card { background:#fff; border:1.5px solid #e2e8f0; border-radius:20px; padding:26px;
            transition:all .32s; cursor:default; position:relative; overflow:hidden; }
    .card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px;
                    background:var(--cc); opacity:0; transition:opacity .35s; }
    .card:hover { transform:translateY(-6px); box-shadow:0 22px 50px rgba(0,0,0,.09); border-color:transparent; }
    .card:hover::before { opacity:1; }
    /* role perm row */
    .prow { display:flex; align-items:center; gap:11px; padding:12px 15px; border-radius:13px;
            background:#f8faff; border:1.5px solid #e2e8f0; font-size:13px; color:#374151;
            font-weight:500; transition:transform .2s; }
    .prow:hover { transform:translateX(5px); }
    /* ltag label */
    .ltag { display:inline-flex; align-items:center; gap:7px; padding:5px 15px; border-radius:50px;
            font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
            background:rgba(37,99,235,.08); border:1px solid rgba(37,99,235,.22); color:#2563eb; margin-bottom:14px; }
    /* bebas heading */
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; line-height:1.05; color:#0f172a; }
    .grad { background:linear-gradient(135deg,#2563eb,#7c3aed); -webkit-background-clip:text;
            -webkit-text-fill-color:transparent; background-clip:text; }
  `;

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "#f0f4ff", overflowX: "hidden" }}>
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <nav className={`${scrolled ? "nav-solid dark-nav" : "light-nav"}`}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, height: 64,
          padding: "0 6%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: scrolled ? undefined : "transparent", transition: "all .4s" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }} onClick={() => go("home")}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#2563eb,#7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            boxShadow: "0 4px 14px rgba(37,99,235,.38)" }}>🔐</div>
          <span className="bh" style={{ fontSize: 22, letterSpacing: 2, color: scrolled ? "#0f172a" : "#fff", transition: "color .4s" }}>
            Cloud<span style={{ color: "#2563eb" }}>Secure</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {NAV.map(({ l, id }) => (
            <button key={id} className={`nav-lnk${activeNav === id ? " act" : ""}`} onClick={() => go(id)}>{l}</button>
          ))}
          <button className="btn-p" style={{ padding: "8px 20px", fontSize: 13, borderRadius: 30 }} onClick={() => nav("/login")}>Login</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{ minHeight: "100vh", display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden" }}>
        <img src="https://img.freepik.com/premium-photo/data-center-network-generative-ai_409545-4435.jpg"
          alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", filter: "brightness(.38) saturate(1.2)", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(to bottom, transparent 0%, rgba(4,7,26,.25) 50%, rgba(4,7,26,.92) 100%)" }} />

        <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 1200,
          margin: "0 auto", padding: "0 6%", paddingTop: 80, display: "grid",
          gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>

          <div style={{ animation: "heroIn .95s cubic-bezier(.22,1,.36,1) both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(37,99,235,.2)",
              border: "1px solid rgba(96,165,250,.4)", color: "#93c5fd", padding: "7px 16px",
              borderRadius: 50, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, background: "#4ade80", borderRadius: "50%", animation: "blink 1.5s infinite" }} />
              IEEE TIFS 2025 · Cloud Storage Security Research
            </div>
            <h1 className="bh" style={{ fontSize: "clamp(3.2rem,6.5vw,5.2rem)", color: "#fff", marginBottom: 18 }}>
              Secure &amp;<br />
              <span style={{ background: "linear-gradient(90deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Zero Vulnerability</span><br />
              Cloud Storage
            </h1>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,.65)", lineHeight: 1.9, maxWidth: 490, marginBottom: 30 }}>
              Research-backed platform fixing <strong style={{ color: "#93c5fd" }}>6 critical upload vulnerabilities</strong> — credential abuse, file overwriting, unauthorized access &amp; callback spoofing — all resolved by design.
            </p>
            <div style={{ display: "flex", gap: 14, marginBottom: 44, flexWrap: "wrap" }}>
              <button className="btn-p" onClick={() => nav("/register")}>🚀 Get Started</button>
              <button className="btn-o" onClick={() => go("vulns")}>View Vulnerabilities</button>
            </div>
            <div style={{ display: "flex", gap: 40 }}>
              {[{ v: "79", l: "Vulns Found" }, { v: "6", l: "Vuln Types" }, { v: "100%", l: "Sites Affected" }].map(s => (
                <div key={s.l}>
                  <div className="bh" style={{ fontSize: "2rem", color: "#60a5fa", letterSpacing: 2 }}>{s.v}</div>
                  <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.38)", textTransform: "uppercase", letterSpacing: "1.5px" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* hero image card (ref-1 style) */}
          <div style={{ animation: "heroIn 1.1s cubic-bezier(.22,1,.36,1) .18s both" }}>
            <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 44px 90px rgba(0,0,0,.7), 0 0 0 1px rgba(96,165,250,.2)",
              animation: "floatA 5.5s ease-in-out infinite" }}>
              <img src="https://tse3.mm.bing.net/th/id/OIP.BziioWxbxxJMSx4XiybwKAHaEw?pid=ImgDet&w=1200&h=768&rs=1&o=7&rm=3"
                alt="Secure Cloud" style={{ width: "100%", height: 260, objectFit: "cover", display: "block",
                  filter: "brightness(.88) saturate(1.3)" }} />
              <div style={{ padding: "14px 18px", background: "rgba(15,23,42,.92)", display: "flex",
                alignItems: "center", gap: 10, backdropFilter: "blur(12px)" }}>
                <span style={{ width: 9, height: 9, background: "#4ade80", borderRadius: "50%", animation: "blink 1.5s infinite" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>S3 Bucket Active — databuckets12 · ap-southeast-2</span>
                <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 20, fontSize: ".65rem",
                  fontWeight: 800, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff" }}>SECURE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding: "96px 6%", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <Slide from="left">
            <div className="ltag">About The Project</div>
            <h2 className="bh" style={{ fontSize: "clamp(2rem,3.5vw,2.8rem)", marginBottom: 16 }}>
              Research-Driven <span className="grad">Cloud Security</span>
            </h2>
            <p style={{ color: "#475569", lineHeight: 1.88, fontSize: ".96rem", marginBottom: 22 }}>
              Based on an IEEE TIFS 2025 study of the top 500 Alexa websites — <strong>182 used cloud storage</strong>, and all 28 tested with upload features had at least one critical flaw. Our platform implements every mitigation: enforced credential lifecycles, AES-256 file encryption, server-side validation, and strict RBAC.
            </p>
            {["Identity-verified, rate-limited credential issuance", "One-time credentials — expire immediately after upload",
              "AES-256 encryption before the file touches AWS S3", "Type & size enforced server-side (jpg/png/pdf/docx/txt, 10MB)",
              "Signed storage paths block all overwrite attacks"].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#dbeafe", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: ".65rem", color: "#2563eb",
                  fontWeight: 800, flexShrink: 0 }}>✓</div>
                <span style={{ fontSize: ".9rem", color: "#374151", fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </Slide>

          <Slide from="right" delay={80}>
            <div style={{ background: "linear-gradient(145deg,#eff6ff,#f0f9ff)", border: "1.5px solid #bfdbfe", borderRadius: 20, padding: 32 }}>
              <div style={{ fontSize: ".68rem", color: "#93c5fd", fontWeight: 700, letterSpacing: "2px", marginBottom: 22 }}>◆ SYSTEM FLOW</div>
              {[{ n: "1", t: "JWT-Verified Credential Request", d: "Identity checked → one-time credential issued", c: "#2563eb" },
                { n: "2", t: "File Encrypted Client-Side", d: "Secret key → SHA-256 → AES-256/ECB cipher", c: "#7c3aed" },
                { n: "3", t: "Stored on AWS S3 (Sydney)", d: "Ciphertext → databuckets12 · Metadata → MySQL", c: "#0891b2" },
                { n: "4", t: "Owner-Only Secure Download", d: "S3 fetch → decrypt via MySQL key → serve file", c: "#059669" }
              ].map((step, i, arr) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: step.c, display: "flex",
                      alignItems: "center", justifyContent: "center", color: "#fff", fontSize: ".75rem",
                      fontWeight: 800, flexShrink: 0 }}>{step.n}</div>
                    {i < arr.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 18, background: `${step.c}33`, marginTop: 3 }} />}
                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                    <div style={{ fontSize: ".87rem", fontWeight: 700, color: "#0f172a" }}>{step.t}</div>
                    <div style={{ fontSize: ".78rem", color: "#64748b", marginTop: 2 }}>{step.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Slide>
        </div>
      </section>

      {/* ── VULNERABILITIES ── */}
      <section id="vulns" style={{ padding: "96px 6%", background: "linear-gradient(135deg,#f0f4ff,#ede9fe)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Slide>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div className="ltag" style={{ background: "rgba(239,68,68,.08)", borderColor: "rgba(239,68,68,.25)", color: "#dc2626" }}>
                ⚠️ Threat Intelligence
              </div>
              <h2 className="bh" style={{ fontSize: "clamp(2rem,3.5vw,2.8rem)" }}>6 Identified <span className="grad">Vulnerabilities</span></h2>
              <p style={{ color: "#64748b", maxWidth: 480, margin: "10px auto 0", lineHeight: 1.8, fontSize: ".93rem" }}>
                100% of the 28 real-world websites tested contained at least one. Our platform fixes all six — by design.
              </p>
            </div>
          </Slide>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {VULNS.map((v, i) => (
              <Slide key={v.code} from="bottom" delay={i * 65}>
                <div className="card" style={{ "--cc": v.c }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: `${v.c}15`,
                      border: `1.5px solid ${v.c}38`, display: "flex", alignItems: "center",
                      justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif",
                      fontSize: ".85rem", letterSpacing: 1, color: v.c }}>{v.code}</div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.c }} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: ".95rem", color: "#0f172a", marginBottom: 8 }}>{v.title}</h3>
                  <p style={{ fontSize: ".83rem", color: "#64748b", lineHeight: 1.75 }}>{v.desc}</p>
                </div>
              </Slide>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "96px 6%", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Slide>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div className="ltag">⚙️ Platform Features</div>
              <h2 className="bh" style={{ fontSize: "clamp(2rem,3.5vw,2.8rem)" }}>Built-in <span className="grad">Security</span></h2>
            </div>
          </Slide>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 22 }}>
            {FEATS.map((f, i) => (
              <Slide key={f.t} from="bottom" delay={i * 70}>
                <div className="card" style={{ textAlign: "center", "--cc": f.c }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.c}12`,
                    border: `1.5px solid ${f.c}28`, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>{f.e}</div>
                  <h3 style={{ fontWeight: 700, fontSize: ".97rem", color: f.c, marginBottom: 9 }}>{f.t}</h3>
                  <p style={{ fontSize: ".83rem", color: "#64748b", lineHeight: 1.75 }}>{f.d}</p>
                </div>
              </Slide>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES (tab switch like YogaFlow) ── */}
      <section id="roles" style={{ padding: "96px 6%", background: "linear-gradient(135deg,#f0f4ff,#eff6ff)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Slide>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <div className="ltag">👥 Access Control</div>
              <h2 className="bh" style={{ fontSize: "clamp(2rem,3.5vw,2.8rem)" }}>Two Roles, <span className="grad">Clear Boundaries</span></h2>
            </div>
          </Slide>
          {/* tab pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 32 }}>
            {ROLES.map((r, i) => (
              <button key={r.title} onClick={() => setActiveRole(i)} style={{
                padding: "10px 28px", borderRadius: 30, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                fontWeight: 700, fontSize: 13, transition: "all .25s",
                border: `2px solid ${activeRole === i ? r.color : "#e2e8f0"}`,
                background: activeRole === i ? r.color : "#fff",
                color: activeRole === i ? "#fff" : "#64748b",
              }}>{r.icon} {r.title}</button>
            ))}
          </div>
          <Slide from="bottom" delay={60}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, padding: "40px 44px",
              borderRadius: 24, background: "#fff", border: `2px solid ${ROLES[activeRole].border}`,
              boxShadow: `0 14px 50px ${ROLES[activeRole].color}18`, transition: "all .4s" }}>
              <div>
                <div style={{ display: "inline-block", padding: "4px 13px", borderRadius: 20, fontSize: ".68rem",
                  fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18,
                  background: `${ROLES[activeRole].color}15`, border: `1.5px solid ${ROLES[activeRole].border}`,
                  color: ROLES[activeRole].color }}>{ROLES[activeRole].tag}</div>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{ROLES[activeRole].icon}</div>
                <h3 className="bh" style={{ fontSize: "1.7rem", color: "#0f172a", marginBottom: 10 }}>{ROLES[activeRole].title}</h3>
                <p style={{ fontSize: ".92rem", color: "#475569", lineHeight: 1.85, marginBottom: 26 }}>{ROLES[activeRole].note}</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {ROLES[activeRole].register && (
                    <button className="btn-p" style={{ borderRadius: 12, padding: "11px 26px" }} onClick={() => nav(ROLES[activeRole].registerPath)}>
                      Register Free →
                    </button>
                  )}
                  <button onClick={() => nav("/login")} style={{
                    padding: "11px 26px", borderRadius: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                    fontWeight: 700, fontSize: 13, transition: "all .25s",
                    border: `2px solid ${ROLES[activeRole].color}`,
                    background: "transparent", color: ROLES[activeRole].color,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = ROLES[activeRole].light; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    {ROLES[activeRole].loginLabel}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: ".68rem", letterSpacing: "2px", color: "#94a3b8", fontWeight: 700, marginBottom: 16 }}>CAPABILITIES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {ROLES[activeRole].items.map((item, j) => (
                    <div key={j} className="prow">
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: ROLES[activeRole].color, flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Slide>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0a0f1e", padding: "52px 6% 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48, paddingBottom: 40,
            borderBottom: "1px solid rgba(255,255,255,.07)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔐</div>
                <span className="bh" style={{ fontSize: 20, color: "#f1f5f9", letterSpacing: 2 }}>
                  Cloud<span style={{ color: "#60a5fa" }}>Secure</span>
                </span>
              </div>
              <p style={{ fontSize: ".84rem", color: "#475569", lineHeight: 1.85, maxWidth: 290 }}>
                IEEE TIFS 2025 research-backed file storage platform. All 6 critical cloud upload vulnerabilities addressed through enforced security design.
              </p>
            </div>
            {[{ title: "NAVIGATE", items: NAV.map(n => ({ l: n.l, fn: () => go(n.id) })) },
              { title: "ACCOUNT",  items: [{ l: "Login", fn: () => nav("/login") }, { l: "Register (User)", fn: () => nav("/register") }, { l: "Register (Manager)", fn: () => nav("/manager/register") }, { l: "Admin Login", fn: () => nav("/login") }] }
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: ".68rem", letterSpacing: "2px", color: "#94a3b8", fontWeight: 700, marginBottom: 16 }}>{col.title}</h4>
                {col.items.map(item => (
                  <div key={item.l} onClick={item.fn} style={{ fontSize: ".88rem", color: "#475569", marginBottom: 10,
                    cursor: "pointer", transition: "color .2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#60a5fa"}
                    onMouseLeave={e => e.currentTarget.style.color = "#475569"}>{item.l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: ".78rem", color: "#334155" }}>© 2025 CloudSecure · IEEE TIFS Research — Cloud Storage Security</span>
            <span style={{ fontSize: ".78rem", color: "#2563eb", fontWeight: 700 }}>✅ All 6 Vulnerabilities Mitigated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}