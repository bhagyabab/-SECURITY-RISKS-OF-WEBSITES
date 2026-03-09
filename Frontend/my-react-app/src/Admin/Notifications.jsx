import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/admin";

export default function Notifications() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [notifs,  setNotifs]  = useState([]);
  const [filter,  setFilter]  = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [counts,  setCounts]  = useState({
    totalNotifications:0, userRegistrations:0,
    fileUploads:0, managerRequests:0, pendingManagers:0
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [nRes, cRes] = await Promise.all([
        axios.get(`${API}/notifications`,       { headers }),
        axios.get(`${API}/notifications/count`, { headers }),
      ]);
      setNotifs(Array.isArray(nRes.data) ? nRes.data : []);
      setCounts(cRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = notifs.filter(n =>
    filter === "ALL"      ||
    (filter === "UPLOADS"  && n.type === "FILE_UPLOAD")      ||
    (filter === "USERS"    && n.type === "USER_REGISTER")    ||
    (filter === "MANAGERS" && n.type === "MANAGER_REQUEST")
  );

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .filter-btn {
      padding:7px 18px; border-radius:8px; cursor:pointer;
      font-size:.78rem; font-weight:700; font-family:'Outfit',sans-serif;
      border:1.5px solid #e2e8f0; background:#fff; color:#64748b; transition:all .22s;
    }
    .filter-btn:hover:not(.active) { border-color:#2563eb; color:#2563eb; }
    .filter-btn.all.active      { background:#0f172a; color:#fff; border-color:#0f172a; }
    .filter-btn.upload.active   { background:#059669; color:#fff; border-color:#059669; }
    .filter-btn.user.active     { background:#2563eb; color:#fff; border-color:#2563eb; }
    .filter-btn.manager.active  { background:#d97706; color:#fff; border-color:#d97706; }

    .notif-card {
      display:flex; align-items:flex-start; gap:14px;
      background:#fff; border-radius:14px; padding:16px 18px;
      border-left:3px solid var(--nc);
      box-shadow:0 1px 8px rgba(0,0,0,.04);
      transition:all .25s; animation:fadeUp .4s ease both;
    }
    .notif-card:hover { transform:translateX(5px); box-shadow:0 6px 20px rgba(0,0,0,.08); }

    .notif-icon {
      width:40px; height:40px; border-radius:11px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:18px; background:var(--nbg); border:1.5px solid var(--nbd);
    }
  `;

  return (
    <div style={{ padding:"88px 5% 60px", background:"#f0f4ff", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>
          Admin · Notifications
        </div>
        <div className="bh" style={{ fontSize:"2.2rem", color:"#0f172a" }}>Notifications</div>
      </div>

      {/* Stat cards — now 4: Total, Uploads, Registrations, Manager Requests */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Activity",      value:counts.totalNotifications, c:"#0f172a" },
          { label:"File Uploads",         value:counts.fileUploads,        c:"#059669" },
          { label:"User Registrations",   value:counts.userRegistrations,  c:"#2563eb" },
          { label:"Manager Requests",     value:counts.managerRequests,    c:"#d97706",
            extra: counts.pendingManagers > 0 ? `${counts.pendingManagers} pending` : null },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", borderTop:`3px solid ${s.c}`,
            borderRadius:12, padding:"14px 18px",
            boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"2rem",
              letterSpacing:2, color:"#0f172a" }}>{s.value}</div>
            <div style={{ fontSize:".72rem", fontWeight:700, color:s.c,
              textTransform:"uppercase", letterSpacing:1.2 }}>{s.label}</div>
            {s.extra && (
              <div style={{ marginTop:5, fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                color:"#ef4444", display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"#ef4444",
                  display:"inline-block", animation:"blink 1.5s infinite" }} />
                {s.extra}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filter + refresh */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:12, marginBottom:18 }}>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button className={`filter-btn all${filter==="ALL"?" active":""}`}
            onClick={() => setFilter("ALL")}>
            All ({notifs.length})
          </button>
          <button className={`filter-btn upload${filter==="UPLOADS"?" active":""}`}
            onClick={() => setFilter("UPLOADS")}>
            File Uploads ({counts.fileUploads})
          </button>
          <button className={`filter-btn user${filter==="USERS"?" active":""}`}
            onClick={() => setFilter("USERS")}>
            Registrations ({counts.userRegistrations})
          </button>
          <button className={`filter-btn manager${filter==="MANAGERS"?" active":""}`}
            onClick={() => setFilter("MANAGERS")}>
            Manager Requests ({counts.managerRequests})
            {counts.pendingManagers > 0 && (
              <span style={{ marginLeft:6, fontSize:".58rem", background:"#ef4444",
                color:"#fff", padding:"1px 6px", borderRadius:20,
                fontFamily:"monospace", fontWeight:800 }}>
                {counts.pendingManagers}
              </span>
            )}
          </button>
        </div>
        <button onClick={fetchAll} style={{ padding:"7px 16px", borderRadius:8,
          border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b",
          cursor:"pointer", fontWeight:700, fontSize:".78rem", fontFamily:"'Outfit',sans-serif" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Notifications list */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
          <div style={{ width:40, height:40, border:"3px solid #e2e8f0",
            borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:16, padding:"60px 0",
          textAlign:"center", boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize:".88rem", color:"#94a3b8" }}>No notifications yet.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((n, i) => {
            const isFile = n.type === "FILE_UPLOAD";
            const isMgr  = n.type === "MANAGER_REQUEST";

            const nc  = isFile ? "#059669" : isMgr ? "#d97706" : "#2563eb";
            const nbg = isFile ? "#f0fdf4"  : isMgr ? "#fffbeb"  : "#eff6ff";
            const nbd = isFile ? "#6ee7b7"  : isMgr ? "#fde68a"  : "#bfdbfe";

            const typeLabel = isFile ? "UPLOAD" : isMgr ? "MANAGER" : "REGISTER";

            return (
              <div key={i} className="notif-card"
                style={{ "--nc":nc, "--nbg":nbg, "--nbd":nbd, animationDelay:`${i*30}ms` }}>
                <div className="notif-icon">{n.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:".9rem", color:"#0f172a" }}>{n.title}</span>
                    <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                      padding:"2px 8px", borderRadius:20, background:nbg, color:nc, border:`1px solid ${nbd}` }}>
                      {typeLabel}
                    </span>
                    {/* Manager pending badge */}
                    {isMgr && n.approvalStatus === "PENDING" && (
                      <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                        padding:"2px 8px", borderRadius:20, background:"#fef2f2",
                        color:"#ef4444", border:"1px solid #fecaca",
                        display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ width:4, height:4, borderRadius:"50%",
                          background:"#ef4444", animation:"blink 1.5s infinite" }} />
                        PENDING APPROVAL
                      </span>
                    )}
                    {isMgr && n.approvalStatus && n.approvalStatus !== "PENDING" && (
                      <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                        padding:"2px 8px", borderRadius:20,
                        background: n.approvalStatus==="APPROVED" ? "#f0fdf4" : "#fef2f2",
                        color:      n.approvalStatus==="APPROVED" ? "#059669" : "#ef4444",
                        border:     n.approvalStatus==="APPROVED" ? "1px solid #6ee7b7" : "1px solid #fecaca" }}>
                        {n.approvalStatus}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:".83rem", color:"#64748b", lineHeight:1.65 }}>{n.message}</p>
                  {n.userEmail && (
                    <div style={{ marginTop:6, fontSize:".72rem", color:"#94a3b8", fontFamily:"monospace" }}>
                      {n.userEmail}
                      {n.fileName && <span> · {n.fileName}</span>}
                    </div>
                  )}
                </div>
                <span style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
                  background:nc, marginTop:6, animation:"blink 2.5s infinite" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}