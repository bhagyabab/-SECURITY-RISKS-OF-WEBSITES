import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8080/api/admin";

function useReveal() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return [ref, on];
}

const Slide = ({ children, from = "bottom", delay = 0 }) => {
  const [ref, on] = useReveal();
  const tx = from === "left" ? "-40px" : from === "right" ? "40px" : "0px";
  const ty = from === "bottom" ? "32px" : "0px";
  return (
    <div ref={ref} style={{
      transform: on ? "translate(0,0)" : `translate(${tx},${ty})`,
      opacity: on ? 1 : 0,
      transition: `transform .6s cubic-bezier(.22,1,.36,1) ${delay}ms, opacity .5s ease ${delay}ms`
    }}>
      {children}
    </div>
  );
};

const VULNS = [
  { code:"V1", label:"Credential Acquisition", c:"#2563eb" },
  { code:"V2", label:"Credential Validity",    c:"#7c3aed" },
  { code:"V3", label:"File Type & Size",        c:"#0891b2" },
  { code:"V4", label:"File Overwriting",        c:"#059669" },
  { code:"V5", label:"File Stealing",           c:"#f97316" },
  { code:"V6", label:"Callback Spoofing",       c:"#ef4444" },
];

export default function AdminDashboard() {
  const nav       = useNavigate();
  const adminName = sessionStorage.getItem("name") || "Admin";
  const token     = sessionStorage.getItem("token");
  const headers   = { Authorization: `Bearer ${token}` };

  // ── stats now includes manager counts from updated /api/admin/dashboard
  const [stats,   setStats]   = useState({
    totalUsers:0, totalFiles:0,
    totalManagers:0, pendingManagers:0, approvedManagers:0
  });
  const [users,   setUsers]   = useState([]);
  const [files,   setFiles]   = useState([]);
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [time,    setTime]    = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, u, f, n] = await Promise.all([
        axios.get(`${API}/dashboard`,     { headers }),
        axios.get(`${API}/users`,         { headers }),
        axios.get(`${API}/files`,         { headers }),
        axios.get(`${API}/notifications`, { headers }),
      ]);
      setStats(d.data);
      setUsers(Array.isArray(u.data)  ? u.data  : []);
      setFiles(Array.isArray(f.data)  ? f.data  : []);
      setNotifs(Array.isArray(n.data) ? n.data.slice(0, 8) : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const storageMB      = files.reduce((a, f) => a + (f.fileSize || 0), 0) / (1024 * 1024);
  const storageDisplay = storageMB >= 1024
    ? (storageMB / 1024).toFixed(2) + " GB"
    : storageMB.toFixed(1) + " MB";

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes heroIn  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; line-height:1.05; }
    .stat-card {
      background:#fff; border-top:3px solid var(--sc); border-radius:14px;
      padding:24px 22px 20px; box-shadow:0 1px 12px rgba(0,0,0,.05); transition:all .28s;
    }
    .stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.1); }
    .stat-num {
      font-family:'Bebas Neue',sans-serif; font-size:3rem; letter-spacing:3px;
      color:#0f172a; line-height:1; margin-bottom:6px;
    }
    .stat-label { font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:var(--sc); }
    .stat-sub   { font-size:.72rem; color:#94a3b8; margin-top:3px; font-weight:400; }
    .stat-divider { width:32px; height:2px; border-radius:2px; background:var(--sc); margin-top:14px; opacity:.4; }

    .pending-badge {
      display:inline-flex; align-items:center; gap:5px;
      font-size:.6rem; font-weight:800; font-family:monospace;
      padding:3px 10px; border-radius:20px;
      background:#fef3c7; border:1px solid #fde68a; color:#d97706;
    }

    .qcard {
      background:#fff; border-radius:14px; padding:18px 20px;
      border:1.5px solid #f1f5f9; cursor:pointer;
      transition:all .25s; display:flex; align-items:center; gap:16px;
      box-shadow:0 1px 8px rgba(0,0,0,.04);
    }
    .qcard:hover { border-color:var(--qc); transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,.08); }
    .qcard-dot  { width:10px; height:10px; border-radius:50%; background:var(--qc); flex-shrink:0; }
    .qcard-arrow { margin-left:auto; font-size:.9rem; color:#cbd5e1; transition:all .22s; font-weight:600; }
    .qcard:hover .qcard-arrow { color:var(--qc); transform:translateX(3px); }

    .sec-head {
      font-size:.65rem; font-weight:800; letter-spacing:2px; text-transform:uppercase;
      color:#94a3b8; font-family:'Outfit',sans-serif; margin-bottom:16px;
      padding-bottom:10px; border-bottom:1px solid #f1f5f9;
    }
    .vbtn {
      font-size:.72rem; font-weight:700; padding:5px 13px; border-radius:7px;
      cursor:pointer; border:1.5px solid var(--bc); background:var(--bg2); color:var(--vc);
      font-family:'Outfit',sans-serif; transition:all .2s;
    }
    .vbtn:hover { opacity:.75; }
    .arow { display:flex; align-items:center; gap:12px; padding:9px 10px; border-radius:10px; transition:background .16s; }
    .arow:hover { background:#f8faff; }
    .vrow {
      display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:9px;
      background:var(--vbg); border:1px solid var(--vbd); transition:transform .2s;
    }
    .vrow:hover { transform:translateX(4px); }
    .trow { transition:background .15s; }
    .trow:hover { background:#f8faff; }
    .uinitial {
      width:34px; height:34px; border-radius:9px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:.9rem; font-weight:800; font-family:'Outfit',sans-serif;
    }
  `;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", flexDirection:"column", gap:14, background:"#f0f4ff" }}>
      <style>{CSS}</style>
      <div style={{ width:40, height:40, border:"3px solid #e2e8f0",
        borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      <p style={{ color:"#94a3b8", fontFamily:"monospace", fontSize:".78rem", letterSpacing:1 }}>
        LOADING DASHBOARD...
      </p>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {/* ══ HERO ══ */}
      <div style={{ position:"relative", minHeight:"100vh", display:"flex",
        flexDirection:"column", justifyContent:"flex-end", overflow:"hidden" }}>

        <img
          src="https://img.freepik.com/premium-photo/data-center-network-generative-ai_409545-4435.jpg"
          alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center center",
            filter:"brightness(.32) saturate(1.15)", zIndex:0 }}
        />
        <div style={{ position:"absolute", inset:0, zIndex:1,
          background:"linear-gradient(to bottom, rgba(4,7,26,.15) 0%, rgba(4,7,26,.55) 60%, rgba(4,7,26,.92) 100%)" }} />
        <div style={{ position:"absolute", inset:0, zIndex:1, opacity:.035,
          backgroundImage:"linear-gradient(rgba(96,165,250,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,.8) 1px,transparent 1px)",
          backgroundSize:"44px 44px" }} />

        <div style={{ position:"relative", zIndex:2, maxWidth:1200, width:"100%",
          margin:"0 auto", padding:"0 5% 90px",
          animation:"heroIn .85s cubic-bezier(.22,1,.36,1) both" }}>

          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(37,99,235,.18)", border:"1px solid rgba(96,165,250,.35)",
            color:"#93c5fd", padding:"6px 16px", borderRadius:50,
            fontSize:".68rem", fontWeight:700, letterSpacing:1.8, marginBottom:20 }}>
            <span style={{ width:6, height:6, background:"#4ade80",
              borderRadius:"50%", animation:"blink 1.5s infinite" }} />
            IEEE TIFS 2025 · ADMIN CONTROL CENTER
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:40, alignItems:"flex-end" }}>
            <div>
              <h1 className="bh" style={{ fontSize:"clamp(2.6rem,5.5vw,4.4rem)", color:"#fff", marginBottom:12 }}>
                Welcome Back,{" "}
                <span style={{ background:"linear-gradient(90deg,#60a5fa,#a78bfa)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  backgroundClip:"text" }}>{adminName}</span>
              </h1>

              <p style={{ fontSize:".9rem", color:"rgba(255,255,255,.5)",
                maxWidth:500, lineHeight:1.85, marginBottom:26, fontWeight:400 }}>
                All <strong style={{ color:"rgba(255,255,255,.75)", fontWeight:700 }}>6 security vulnerabilities</strong> are mitigated.
                Platform is secure and fully operational.
              </p>

              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:28 }}>
                {VULNS.map(v => (
                  <span key={v.code} style={{
                    padding:"4px 12px", borderRadius:20,
                    background:`${v.c}18`, border:`1px solid ${v.c}38`,
                    color:v.c, fontSize:".6rem", fontFamily:"monospace",
                    fontWeight:800, letterSpacing:.5
                  }}>{v.code} FIXED</span>
                ))}
              </div>

              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {[
                  { l:"Manage Users",  p:"/admin/users",         c:"#2563eb" },
                  { l:"View Files",    p:"/admin/files",         c:"#059669" },
                  { l:"Notifications", p:"/admin/notifications", c:"#f97316" },
                ].map(b => (
                  <button key={b.p} onClick={() => nav(b.p)} style={{
                    padding:"9px 20px", borderRadius:9, cursor:"pointer",
                    fontFamily:"'Outfit',sans-serif", fontWeight:600,
                    fontSize:".82rem", border:`1.5px solid ${b.c}60`,
                    background:`${b.c}18`, color:"rgba(255,255,255,.85)",
                    transition:"all .25s", backdropFilter:"blur(8px)"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background=b.c; e.currentTarget.style.color="#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background=`${b.c}18`; e.currentTarget.style.color="rgba(255,255,255,.85)"; }}>
                    {b.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Live clock + quick stats */}
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div className="bh" style={{ fontSize:"3rem", letterSpacing:3, color:"#60a5fa", lineHeight:1 }}>
                {time.toLocaleTimeString()}
              </div>
              <div style={{ fontFamily:"monospace", fontSize:".6rem",
                color:"rgba(255,255,255,.25)", letterSpacing:1.2, marginTop:5 }}>
                {time.toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"short", day:"numeric" })}
              </div>
              <div style={{ marginTop:18, display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                {[
                  { l:"USERS",    v:stats.totalUsers,   c:"#60a5fa" },
                  { l:"FILES",    v:stats.totalFiles,   c:"#4ade80" },
                  { l:"MANAGERS", v:stats.totalManagers, c:"#fbbf24" },
                ].map(s => (
                  <div key={s.l} style={{ display:"flex", alignItems:"baseline", gap:10 }}>
                    <span style={{ fontSize:".58rem", color:"rgba(255,255,255,.28)",
                      fontFamily:"monospace", letterSpacing:1.5 }}>{s.l}</span>
                    <span className="bh" style={{ fontSize:"1.8rem", color:s.c, letterSpacing:2 }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ background:"#f0f4ff", padding:"0 5% 64px", marginTop:-24, position:"relative", zIndex:3 }}>

        {/* ── 5 STAT CARDS — Users, Files, Storage, Managers, Pending Managers ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total Users",       value:stats.totalUsers,      sub:"Registered accounts",     c:"#2563eb", bg:"#eff6ff", bc:"#bfdbfe", icon:"👥" },
            { label:"Total Files",       value:stats.totalFiles,      sub:"Encrypted on AWS S3",     c:"#059669", bg:"#f0fdf4", bc:"#6ee7b7", icon:"📁" },
            
            { label:"Total Managers",    value:stats.totalManagers,   sub:"Approved + pending",      c:"#d97706", bg:"#fffbeb", bc:"#fde68a", icon:"⚙️" },
            { label:"Pending Managers",  value:stats.pendingManagers, sub:"Awaiting approval",       c:"#ef4444", bg:"#fef2f2", bc:"#fecaca", icon:"⏳" },
          ].map((s, i) => (
            <Slide key={s.label} from="bottom" delay={i * 55}>
              <div
                className="stat-card"
                style={{ "--sc": s.c, cursor: s.label === "Pending Managers" || s.label === "Total Managers" ? "pointer" : "default" }}
                onClick={() => { if (s.label === "Pending Managers" || s.label === "Total Managers") nav("/admin/users"); }}
              >
                <div style={{
                  width:42, height:42, borderRadius:11, marginBottom:14,
                  background:s.bg, border:`1.5px solid ${s.bc}`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:20
                }}>{s.icon}</div>
                <div className="stat-num">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-sub">{s.sub}</div>
                {/* pending badge — only on Pending Managers card */}
                {s.label === "Pending Managers" && stats.pendingManagers > 0 && (
                  <div style={{ marginTop:10 }}>
                    <span className="pending-badge">
                      <span style={{ width:5, height:5, borderRadius:"50%", background:"#d97706", animation:"blink 1.5s infinite" }} />
                      ACTION NEEDED
                    </span>
                  </div>
                )}
                <div className="stat-divider" />
              </div>
            </Slide>
          ))}
        </div>

        {/* ── QUICK ACTIONS + VULN STATUS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

          <Slide from="left">
            <div style={{ background:"#fff", borderRadius:16, padding:"22px 20px",
              boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
              <div className="sec-head">Quick Actions</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { label:"Manage Users & Managers", sub:"View, approve managers, delete users", path:"/admin/users",         c:"#2563eb" },
                  { label:"Manage Files",             sub:"View & delete uploaded files",         path:"/admin/files",         c:"#059669" },
                  { label:"Notifications",            sub:"Uploads, registrations & requests",    path:"/admin/notifications", c:"#f97316" },
                  { label:"Security Overview",        sub:"All 6 vulnerabilities fixed",          path:"/admin/dashboard",     c:"#7c3aed" },
                ].map(q => (
                  <div key={q.path} className="qcard" style={{ "--qc": q.c }} onClick={() => nav(q.path)}>
                    <span className="qcard-dot" />
                    <div>
                      <div style={{ fontWeight:700, fontSize:".86rem", color:"#0f172a" }}>{q.label}</div>
                      <div style={{ fontSize:".72rem", color:"#94a3b8", marginTop:1 }}>{q.sub}</div>
                    </div>
                    <span className="qcard-arrow">›</span>
                  </div>
                ))}
              </div>
            </div>
          </Slide>

          <Slide from="right" delay={80}>
            <div style={{ background:"linear-gradient(160deg,#04071a,#080d24)",
              borderRadius:16, padding:"22px 20px",
              border:"1px solid rgba(255,255,255,.06)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ fontSize:".65rem", fontWeight:800, letterSpacing:2,
                  textTransform:"uppercase", color:"rgba(255,255,255,.3)",
                  fontFamily:"'Outfit',sans-serif", paddingBottom:10,
                  borderBottom:"1px solid rgba(255,255,255,.06)", width:"100%",
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>Vulnerability Status</span>
                  <span style={{ fontSize:".6rem", background:"rgba(34,197,94,.12)",
                    border:"1px solid rgba(34,197,94,.28)", color:"#4ade80",
                    padding:"2px 10px", borderRadius:20, fontWeight:800 }}>6 / 6 FIXED</span>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                {VULNS.map(v => (
                  <div key={v.code} className="vrow" style={{ "--vbg":`${v.c}10`, "--vbd":`${v.c}25` }}>
                    <span style={{ fontFamily:"monospace", fontSize:".68rem",
                      fontWeight:900, color:v.c, width:22 }}>{v.code}</span>
                    <span style={{ fontSize:".68rem", color:"rgba(255,255,255,.4)", flex:1 }}>{v.label}</span>
                    <span style={{ color:"#4ade80", fontSize:".7rem", fontWeight:800 }}>✓</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid rgba(255,255,255,.05)",
                display:"flex", gap:16, flexWrap:"wrap" }}>
                {[["Spring Boot","3.5"],["MySQL","DB"],["AWS S3","Storage"],["AES-256","Encrypt"]].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:".55rem", color:"rgba(255,255,255,.2)",
                      fontFamily:"monospace", letterSpacing:1, textTransform:"uppercase" }}>{l}</div>
                    <div style={{ fontSize:".7rem", fontWeight:700, color:"#60a5fa" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Slide>
        </div>

        {/* ── RECENT USERS + RECENT ACTIVITY ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

          <Slide from="left">
            <div style={{ background:"#fff", borderRadius:16, padding:"22px 20px",
              boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div className="sec-head" style={{ marginBottom:0, borderBottom:"none", paddingBottom:0 }}>Recent Users</div>
                <button className="vbtn" style={{ "--vc":"#2563eb","--bc":"#bfdbfe","--bg2":"#eff6ff" }}
                  onClick={() => nav("/admin/users")}>View All</button>
              </div>
              <div style={{ height:1, background:"#f1f5f9", margin:"10px 0 14px" }} />
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {users.length === 0
                  ? <p style={{ color:"#94a3b8", fontSize:".82rem", textAlign:"center", padding:"20px 0" }}>No users found.</p>
                  : users.slice(0,5).map((u, i) => {
                    const palette = ["#2563eb","#7c3aed","#059669","#f97316","#0891b2"];
                    const c = palette[i % palette.length];
                    return (
                      <div key={u.id} className="arow">
                        <div className="uinitial" style={{ background:`${c}12`, color:c, border:`1px solid ${c}25` }}>
                          {u.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:".85rem", color:"#0f172a",
                            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.name}</div>
                          <div style={{ fontSize:".72rem", color:"#94a3b8",
                            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.email}</div>
                        </div>
                        <span style={{ fontSize:".58rem", background:"#f0f9ff", color:"#0891b2",
                          border:"1px solid #bae6fd", padding:"2px 8px",
                          borderRadius:20, fontFamily:"monospace", fontWeight:800, flexShrink:0 }}>
                          {u.role || "USER"}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Slide>

          <Slide from="right" delay={60}>
            <div style={{ background:"#fff", borderRadius:16, padding:"22px 20px",
              boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div className="sec-head" style={{ marginBottom:0, borderBottom:"none", paddingBottom:0 }}>Recent Activity</div>
                <button className="vbtn" style={{ "--vc":"#f97316","--bc":"#fed7aa","--bg2":"#fff7ed" }}
                  onClick={() => nav("/admin/notifications")}>View All</button>
              </div>
              <div style={{ height:1, background:"#f1f5f9", margin:"10px 0 14px" }} />
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {notifs.length === 0
                  ? <p style={{ color:"#94a3b8", fontSize:".82rem", textAlign:"center", padding:"20px 0" }}>No activity yet.</p>
                  : notifs.map((n, i) => {
                    const isFile = n.type === "FILE_UPLOAD";
                    const isMgr  = n.type === "MANAGER_REQUEST";
                    const nc = isFile ? "#059669" : isMgr ? "#d97706" : "#2563eb";
                    const nbg = isFile ? "#f0fdf4" : isMgr ? "#fffbeb" : "#eff6ff";
                    const nbd = isFile ? "#6ee7b7" : isMgr ? "#fde68a" : "#bfdbfe";
                    return (
                      <div key={i} className="arow">
                        <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                          background:nbg, border:`1px solid ${nbd}`,
                          display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>
                          {n.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:".84rem", color:"#0f172a" }}>{n.title}</div>
                          <div style={{ fontSize:".72rem", color:"#64748b",
                            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{n.message}</div>
                        </div>
                        <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
                          background:nc, animation:"blink 2s infinite" }} />
                      </div>
                    );
                  })}
              </div>
            </div>
          </Slide>
        </div>

        {/* ── RECENT FILES TABLE ── */}
        <Slide from="bottom">
          <div style={{ background:"#fff", borderRadius:16, padding:"22px 20px",
            boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div className="sec-head" style={{ marginBottom:0, borderBottom:"none", paddingBottom:0 }}>Recent Files</div>
              <button className="vbtn" style={{ "--vc":"#059669","--bc":"#6ee7b7","--bg2":"#f0fdf4" }}
                onClick={() => nav("/admin/files")}>View All</button>
            </div>
            <div style={{ height:1, background:"#f1f5f9", margin:"10px 0 16px" }} />
            {files.length === 0
              ? <div style={{ textAlign:"center", padding:"32px 0", color:"#94a3b8", fontSize:".85rem" }}>No files uploaded yet.</div>
              : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr>
                        {["#","File Name","Uploaded By","Type","Size","Status"].map(h => (
                          <th key={h} style={{ padding:"6px 12px", textAlign:"left",
                            fontSize:".6rem", fontWeight:800, color:"#94a3b8",
                            letterSpacing:1.5, fontFamily:"monospace",
                            textTransform:"uppercase", borderBottom:"2px solid #f1f5f9" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {files.slice(0, 6).map((f, i) => {
                        const ext = f.fileName?.split(".").pop()?.toUpperCase() || "?";
                        const ec  = { PDF:"#ef4444",JPG:"#2563eb",JPEG:"#2563eb",PNG:"#059669",DOCX:"#7c3aed",TXT:"#f97316" }[ext] || "#64748b";
                        const status = f.status || "PENDING";
                        const sc = status === "APPROVED" ? "#059669" : status === "REJECTED" ? "#ef4444" : "#d97706";
                        const sbg = status === "APPROVED" ? "#f0fdf4" : status === "REJECTED" ? "#fef2f2" : "#fffbeb";
                        const sbd = status === "APPROVED" ? "#6ee7b7" : status === "REJECTED" ? "#fecaca" : "#fde68a";
                        return (
                          <tr key={f.id} className="trow" style={{ borderBottom:"1px solid #f8faff" }}>
                            <td style={{ padding:"11px 12px", fontSize:".76rem", color:"#cbd5e1", fontFamily:"monospace" }}>{String(i+1).padStart(2,"0")}</td>
                            <td style={{ padding:"11px 12px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                                <span style={{ fontSize:".56rem", fontFamily:"monospace", fontWeight:800,
                                  color:ec, background:`${ec}10`, border:`1px solid ${ec}28`,
                                  padding:"2px 7px", borderRadius:5 }}>{ext}</span>
                                <span style={{ fontSize:".85rem", fontWeight:600, color:"#0f172a" }}>{f.fileName}</span>
                              </div>
                            </td>
                            <td style={{ padding:"11px 12px", fontSize:".82rem", color:"#64748b" }}>{f.email}</td>
                            <td style={{ padding:"11px 12px" }}>
                              <span style={{ fontSize:".6rem", color:"#7c3aed", background:"#f5f3ff",
                                border:"1px solid #ddd6fe", padding:"2px 9px", borderRadius:20,
                                fontFamily:"monospace", fontWeight:700 }}>{f.fileType || ext}</span>
                            </td>
                            <td style={{ padding:"11px 12px", fontSize:".78rem", color:"#64748b", fontFamily:"monospace" }}>
                              {f.fileSize ? (f.fileSize/1024).toFixed(1)+" KB" : "—"}
                            </td>
                            <td style={{ padding:"11px 12px" }}>
                              <span style={{ fontSize:".6rem", color:sc, background:sbg,
                                border:`1px solid ${sbd}`, padding:"2px 9px", borderRadius:20,
                                fontFamily:"monospace", fontWeight:700 }}>{status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </Slide>
      </div>
    </div>
  );
}