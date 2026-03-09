import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8080/api/manager";

export default function ManagerDashboard() {
  const nav     = useNavigate();
  const token   = sessionStorage.getItem("token");
  const name    = sessionStorage.getItem("name") || "Manager";
  const headers = { Authorization: `Bearer ${token}` };

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [time,    setTime]    = useState(new Date());

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/dashboard`, { headers });
      setStats(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes heroIn  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .stat-card {
      background:#fff; border-top:3px solid var(--sc); border-radius:14px;
      padding:20px 22px; transition:all .28s; cursor:pointer;
      box-shadow:0 2px 14px rgba(0,0,0,.05);
    }
    .stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.1); }
    .stat-divider { width:32px; height:2px; border-radius:2px; background:var(--sc); margin-top:14px; opacity:.4; }

    .quick-btn {
      display:flex; align-items:center; gap:14px; padding:16px 20px;
      background:#fff; border-radius:14px; border:1.5px solid #fde68a;
      cursor:pointer; transition:all .25s; font-family:'Outfit',sans-serif;
      box-shadow:0 1px 8px rgba(0,0,0,.04); width:100%; text-align:left;
    }
    .quick-btn:hover { border-color:#d97706; background:#fffbeb; transform:translateX(4px); box-shadow:0 6px 20px rgba(217,119,6,.12); }
  `;

  const STATS = stats ? [
    { label:"Total Files",    value:stats.totalFiles,    c:"#d97706", path:"/manager/files" },
    { label:"Pending Review", value:stats.pendingFiles,  c:"#ef4444", path:"/manager/files" },
    { label:"Approved",       value:stats.approvedFiles, c:"#059669", path:"/manager/files" },
    { label:"Rejected",       value:stats.rejectedFiles, c:"#64748b", path:"/manager/files" },
    { label:"Total Users",    value:stats.totalUsers,    c:"#0891b2", path:"/manager/users" },
  ] : [];

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {/* ══ HERO ══ */}
      <div style={{ position:"relative", minHeight:"100vh", display:"flex",
        flexDirection:"column", justifyContent:"flex-end", overflow:"hidden" }}>

        {/* Background image */}
        <img
          src="https://blog.uniqkey.eu/wp-content/uploads/2024/01/cybersecurity-awareness-tips.jpg"
          alt=""
          style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center center",
            filter:"brightness(.3) saturate(1.2)", zIndex:0 }}
        />

        {/* Dark gradient overlay */}
        <div style={{ position:"absolute", inset:0, zIndex:1,
          background:"linear-gradient(to bottom, rgba(4,7,26,.15) 0%, rgba(4,7,26,.55) 60%, rgba(4,7,26,.92) 100%)" }} />

        {/* Amber grid overlay */}
        <div style={{ position:"absolute", inset:0, zIndex:1, opacity:.035,
          backgroundImage:"linear-gradient(rgba(251,191,36,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(251,191,36,.8) 1px,transparent 1px)",
          backgroundSize:"44px 44px" }} />

        {/* Hero content */}
        <div style={{ position:"relative", zIndex:2, maxWidth:1200, width:"100%",
          margin:"0 auto", padding:"0 5% 90px",
          animation:"heroIn .85s cubic-bezier(.22,1,.36,1) both" }}>

          {/* Status pill */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(217,119,6,.18)", border:"1px solid rgba(251,191,36,.35)",
            color:"#fcd34d", padding:"6px 16px", borderRadius:50,
            fontSize:".68rem", fontWeight:700, letterSpacing:1.8, marginBottom:20 }}>
            <span style={{ width:6, height:6, background:"#fbbf24", borderRadius:"50%",
              animation:"blink 1.5s infinite" }} />
            MANAGER PANEL · YOUR DASHBOARD
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:40, alignItems:"flex-end" }}>
            <div>
              <h1 className="bh" style={{ fontSize:"clamp(2.4rem,5vw,4rem)", color:"#fff", marginBottom:12 }}>
                Welcome,{" "}
                <span style={{ background:"linear-gradient(90deg,#fbbf24,#f97316)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  {name}
                </span>
              </h1>
              <p style={{ fontSize:".9rem", color:"rgba(255,255,255,.5)", maxWidth:520, lineHeight:1.85, marginBottom:26 }}>
                Review <strong style={{ color:"rgba(255,255,255,.75)" }}>pending file uploads</strong>, approve or reject submissions, and keep the platform content under control.
              </p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {[
                  { l:"Review Files",  p:"/manager/files",         c:"#d97706" },
                  { l:"Users",         p:"/manager/users",         c:"#0891b2" },
                  { l:"Notifications", p:"/manager/notifications", c:"#059669" },
                ].map(b => (
                  <button key={b.p} onClick={() => nav(b.p)} style={{
                    padding:"9px 20px", borderRadius:9, cursor:"pointer",
                    fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:".82rem",
                    border:`1.5px solid ${b.c}60`, background:`${b.c}18`,
                    color:"rgba(255,255,255,.85)", transition:"all .25s"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background=b.c; e.currentTarget.style.color="#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background=`${b.c}18`; e.currentTarget.style.color="rgba(255,255,255,.85)"; }}>
                    {b.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: live clock + quick stats */}
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div className="bh" style={{ fontSize:"2.8rem", letterSpacing:3, color:"#fbbf24" }}>
                {time.toLocaleTimeString()}
              </div>
              <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"rgba(255,255,255,.25)",
                letterSpacing:1.2, marginTop:4 }}>
                {time.toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"short", day:"numeric" })}
              </div>
              <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:5, alignItems:"flex-end" }}>
                {[
                  { l:"TOTAL FILES", v: stats?.totalFiles   ?? "—", c:"#fbbf24" },
                  { l:"PENDING",     v: stats?.pendingFiles  ?? "—", c:"#ef4444" },
                  { l:"USERS",       v: stats?.totalUsers   ?? "—", c:"#22d3ee" },
                ].map(s => (
                  <div key={s.l} style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                    <span style={{ fontSize:".58rem", color:"rgba(255,255,255,.28)",
                      fontFamily:"monospace", letterSpacing:1.5 }}>{s.l}</span>
                    <span className="bh" style={{ fontSize:"1.6rem", color:s.c, letterSpacing:2 }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div style={{ background:"#fff9f0", padding:"0 5% 64px", marginTop:-24, position:"relative", zIndex:3 }}>

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14,
          marginBottom:24, paddingTop:32 }}>
          {loading ? (
            <div style={{ gridColumn:"1/-1", display:"flex", justifyContent:"center", padding:"40px 0" }}>
              <div style={{ width:36, height:36, border:"3px solid #fde68a",
                borderTopColor:"#d97706", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
            </div>
          ) : STATS.map((s, i) => (
            <div key={s.label} className="stat-card"
              style={{ "--sc":s.c, animationDelay:`${i*55}ms`, animation:"fadeUp .5s ease both" }}
              onClick={() => nav(s.path)}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"2.2rem",
                color:"#1c1917", letterSpacing:2 }}>{s.value ?? "—"}</div>
              <div style={{ fontSize:".72rem", fontWeight:700, color:s.c,
                textTransform:"uppercase", letterSpacing:1.2, marginTop:4 }}>{s.label}</div>
              <div className="stat-divider" />
            </div>
          ))}
        </div>

        {/* Two-column lower section */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

          {/* Pending spotlight */}
          <div style={{ background:"#fff", borderRadius:18, padding:"26px 28px",
            boxShadow:"0 2px 14px rgba(0,0,0,.05)", borderTop:"3px solid #ef4444" }}>
            <div style={{ fontSize:".62rem", fontFamily:"monospace", fontWeight:800,
              letterSpacing:2, color:"#ef4444", marginBottom:14, textTransform:"uppercase" }}>⏳ Pending Files</div>
            <div className="bh" style={{ fontSize:"3.5rem", color:"#1c1917", letterSpacing:2 }}>
              {stats?.pendingFiles ?? "—"}
            </div>
            <p style={{ fontSize:".84rem", color:"#78716c", lineHeight:1.7, marginTop:8, marginBottom:16 }}>
              {stats?.pendingFiles > 0
                ? `${stats.pendingFiles} file${stats.pendingFiles !== 1 ? "s" : ""} are waiting for your review and approval.`
                : "All caught up! No pending files to review right now."}
            </p>
            {stats?.pendingFiles > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444",
                  animation:"blink 1.5s infinite" }} />
                <span style={{ fontSize:".72rem", fontFamily:"monospace", fontWeight:700,
                  color:"#ef4444", letterSpacing:1 }}>ACTION REQUIRED</span>
              </div>
            )}
            <button onClick={() => nav("/manager/files")} style={{
              padding:"10px 22px", borderRadius:10, border:"none", cursor:"pointer",
              background:"linear-gradient(135deg,#d97706,#f59e0b)", color:"#fff",
              fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:".82rem",
              boxShadow:"0 4px 14px rgba(217,119,6,.28)", transition:"all .22s"
            }}
              onMouseEnter={e => e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform="translateY(0)"}>
              Review Files →
            </button>
          </div>

          {/* Quick actions */}
          <div style={{ background:"#fff", borderRadius:18, padding:"26px 28px",
            boxShadow:"0 2px 14px rgba(0,0,0,.05)" }}>
            <div style={{ fontSize:".62rem", fontFamily:"monospace", fontWeight:800,
              letterSpacing:2, color:"#d97706", marginBottom:18, textTransform:"uppercase" }}>⚡ Quick Actions</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { icon:"📋", label:"Review Pending Files", sub:"Approve or reject uploads",  path:"/manager/files" },
                { icon:"👥", label:"View All Users",        sub:"Browse registered accounts", path:"/manager/users" },
                { icon:"🔔", label:"Notifications",         sub:"Activity & upload alerts",   path:"/manager/notifications" },
              ].map(a => (
                <button key={a.path} className="quick-btn" onClick={() => nav(a.path)}>
                  <span style={{ fontSize:20 }}>{a.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:".85rem", color:"#1c1917" }}>{a.label}</div>
                    <div style={{ fontSize:".73rem", color:"#a8a29e" }}>{a.sub}</div>
                  </div>
                  <span style={{ fontSize:14, color:"#d97706" }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}