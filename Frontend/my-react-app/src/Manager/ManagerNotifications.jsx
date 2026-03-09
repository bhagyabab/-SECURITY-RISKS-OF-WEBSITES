import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/manager";

export default function ManagerNotifications() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [notifs,  setNotifs]  = useState([]);
  const [filter,  setFilter]  = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [counts,  setCounts]  = useState({
    totalNotifications:0, userRegistrations:0, fileUploads:0, pendingApprovals:0
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
    (filter === "UPLOADS" && n.type === "FILE_UPLOAD")   ||
    (filter === "USERS"   && n.type === "USER_REGISTER")
  );

  const STATUS_STYLE = {
    PENDING:  { color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
    APPROVED: { color:"#059669", bg:"#f0fdf4", border:"#6ee7b7" },
    REJECTED: { color:"#ef4444", bg:"#fef2f2", border:"#fecaca" },
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin   { to{transform:rotate(360deg)} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .filter-btn { padding:7px 18px; border-radius:8px; cursor:pointer;
      font-size:.78rem; font-weight:700; font-family:'Outfit',sans-serif;
      border:1.5px solid #e7e5e4; background:#fff; color:#78716c; transition:all .22s; }
    .filter-btn:hover:not(.active) { border-color:#d97706; color:#d97706; }
    .filter-btn.all.active    { background:#1c1917; color:#fff; border-color:#1c1917; }
    .filter-btn.upload.active { background:#d97706; color:#fff; border-color:#d97706; }
    .filter-btn.user.active   { background:#059669; color:#fff; border-color:#059669; }

    .notif-card { display:flex; align-items:flex-start; gap:14px;
      background:#fff; border-radius:14px; padding:16px 18px;
      border-left:3px solid var(--nc);
      box-shadow:0 1px 8px rgba(0,0,0,.04);
      transition:all .25s; animation:fadeUp .4s ease both; }
    .notif-card:hover { transform:translateX(5px); box-shadow:0 6px 20px rgba(0,0,0,.08); }

    .notif-icon { width:40px; height:40px; border-radius:11px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:18px; background:var(--nbg); border:1.5px solid var(--nbd); }
  `;

  return (
    <div style={{ padding:"88px 5% 60px", background:"#fff9f0", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:".65rem", color:"#a8a29e", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Manager · Notifications</div>
        <div className="bh" style={{ fontSize:"2.2rem", color:"#1c1917" }}>Notifications</div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Activity",    value:counts.totalNotifications, c:"#1c1917" },
          { label:"File Uploads",      value:counts.fileUploads,        c:"#d97706" },
          { label:"Registrations",     value:counts.userRegistrations,  c:"#059669" },
          { label:"Pending Approvals", value:counts.pendingApprovals,   c:"#ef4444",
            extra: counts.pendingApprovals > 0 ? `${counts.pendingApprovals} need review` : null },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", borderTop:`3px solid ${s.c}`,
            borderRadius:12, padding:"14px 18px", boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"2rem",
              letterSpacing:2, color:"#1c1917" }}>{s.value}</div>
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
            onClick={() => setFilter("ALL")}>All ({notifs.length})</button>
          <button className={`filter-btn upload${filter==="UPLOADS"?" active":""}`}
            onClick={() => setFilter("UPLOADS")}>File Uploads ({counts.fileUploads})</button>
          <button className={`filter-btn user${filter==="USERS"?" active":""}`}
            onClick={() => setFilter("USERS")}>Registrations ({counts.userRegistrations})</button>
        </div>
        <button onClick={fetchAll} style={{ padding:"7px 16px", borderRadius:8,
          border:"1.5px solid #e7e5e4", background:"#fff", color:"#78716c",
          cursor:"pointer", fontWeight:700, fontSize:".78rem", fontFamily:"'Outfit',sans-serif" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Notification list */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
          <div style={{ width:40, height:40, border:"3px solid #fde68a",
            borderTopColor:"#d97706", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:16, padding:"60px 0",
          textAlign:"center", boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize:".88rem", color:"#a8a29e" }}>No notifications yet.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((n, i) => {
            const isFile = n.type === "FILE_UPLOAD";
            const nc  = isFile ? "#d97706" : "#059669";
            const nbg = isFile ? "#fffbeb" : "#f0fdf4";
            const nbd = isFile ? "#fde68a" : "#6ee7b7";
            const typeLabel = isFile ? "UPLOAD" : "REGISTER";
            const statusStyle = n.status ? (STATUS_STYLE[n.status] || STATUS_STYLE.PENDING) : null;

            return (
              <div key={i} className="notif-card"
                style={{ "--nc":nc, "--nbg":nbg, "--nbd":nbd, animationDelay:`${i*25}ms` }}>
                <div className="notif-icon">{n.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:".9rem", color:"#1c1917" }}>{n.title}</span>
                    <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                      padding:"2px 8px", borderRadius:20, background:nbg, color:nc, border:`1px solid ${nbd}` }}>
                      {typeLabel}
                    </span>
                    {isFile && statusStyle && (
                      <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                        padding:"2px 8px", borderRadius:20,
                        color:statusStyle.color, background:statusStyle.bg, border:`1px solid ${statusStyle.border}` }}>
                        {n.status}
                      </span>
                    )}
                    {isFile && n.status === "PENDING" && (
                      <span style={{ fontSize:".58rem", fontFamily:"monospace", fontWeight:800,
                        padding:"2px 8px", borderRadius:20, background:"#fef2f2",
                        color:"#ef4444", border:"1px solid #fecaca",
                        display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ width:4, height:4, borderRadius:"50%",
                          background:"#ef4444", animation:"blink 1.5s infinite" }} />
                        NEEDS REVIEW
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize:".83rem", color:"#78716c", lineHeight:1.65 }}>{n.message}</p>
                  {n.userEmail && (
                    <div style={{ marginTop:6, fontSize:".72rem", color:"#a8a29e", fontFamily:"monospace" }}>
                      {n.userEmail}
                      {n.fileName && <span> · {n.fileName}</span>}
                    </div>
                  )}
                </div>
                <span style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
                  background:nc, marginTop:6,
                  animation: n.status === "PENDING" ? "blink 2s infinite" : "none" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}