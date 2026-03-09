import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/manager";

export default function ManagerUsers() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/users`, { headers });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) { showToast("Failed to load users", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_COLORS = {
    USER:  { color:"#059669", bg:"#f0fdf4", border:"#6ee7b7" },
    ADMIN: { color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin   { to{transform:rotate(360deg)} }
    @keyframes slideIn{ from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .search-input { width:100%; padding:10px 16px 10px 40px; border-radius:10px;
      border:1.5px solid #e7e5e4; background:#fff; font-family:'Outfit',sans-serif;
      font-size:.87rem; color:#1c1917; outline:none; transition:border .2s; }
    .search-input:focus { border-color:#d97706; box-shadow:0 0 0 3px rgba(217,119,6,.08); }

    .user-row { display:grid; grid-template-columns:48px 1fr 200px 90px;
      align-items:center; gap:14px; padding:14px 18px; border-radius:12px;
      transition:background .15s; animation:fadeUp .4s ease both; }
    .user-row:hover { background:#fffbeb; }

    .toast { position:fixed; bottom:28px; right:28px; z-index:9999;
      padding:12px 20px; border-radius:10px; font-size:.84rem; font-weight:600;
      animation:slideIn .3s ease; font-family:'Outfit',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.12); }
    .toast.success { background:#f0fdf4; border:1.5px solid #6ee7b7; color:#059669; }
    .toast.error   { background:#fef2f2; border:1.5px solid #fecaca; color:#ef4444; }
  `;

  return (
    <div style={{ padding:"88px 5% 60px", background:"#fff9f0", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:".65rem", color:"#a8a29e", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Manager · Users</div>
        <div className="bh" style={{ fontSize:"2.2rem", color:"#1c1917" }}>All Users</div>
        <p style={{ fontSize:".84rem", color:"#78716c", marginTop:4 }}>
          Read-only view — contact Admin to modify user accounts.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:22 }}>
        {[
          { label:"Total Users", value:users.length, c:"#d97706" },
          { label:"Regular Users", value:users.filter(u => u.role === "USER").length, c:"#059669" },
          //{ label:"Admins", value:users.filter(u => u.role === "ADMIN").length, c:"#2563eb" },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", borderTop:`3px solid ${s.c}`,
            borderRadius:12, padding:"14px 18px", flex:1, boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.8rem",
              letterSpacing:2, color:"#1c1917" }}>{s.value}</div>
            <div style={{ fontSize:".72rem", fontWeight:700, color:s.c,
              textTransform:"uppercase", letterSpacing:1.2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background:"#fff", borderRadius:16, padding:"22px",
        boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>

        {/* Read-only notice */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
          background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:10, marginBottom:16 }}>
          <span style={{ fontSize:16 }}>ℹ️</span>
          <span style={{ fontSize:".78rem", color:"#92400e", fontWeight:600 }}>
            View-only access — managers cannot delete or modify user accounts.
          </span>
        </div>

        {/* Search */}
        <div style={{ display:"flex", gap:12, marginBottom:20 }}>
          <div style={{ position:"relative", flex:1 }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#a8a29e" }}>🔍</span>
            <input className="search-input" placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={fetchUsers} style={{ padding:"9px 18px", borderRadius:9,
            border:"1.5px solid #fde68a", background:"#fffbeb", color:"#d97706",
            cursor:"pointer", fontWeight:700, fontSize:".8rem", fontFamily:"'Outfit',sans-serif" }}>↻ Refresh</button>
        </div>

        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"48px 1fr 200px 90px",
          gap:14, padding:"8px 18px", borderBottom:"2px solid #f5f5f4", marginBottom:4 }}>
          {["#","User","Email","Role"].map(h => (
            <div key={h} style={{ fontSize:".62rem", fontWeight:800, color:"#a8a29e",
              letterSpacing:1.5, fontFamily:"monospace", textTransform:"uppercase" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"48px 0" }}>
            <div style={{ width:36, height:36, border:"3px solid #fde68a",
              borderTopColor:"#d97706", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 0", color:"#a8a29e", fontSize:".85rem" }}>
            {search ? "No users match your search." : "No users found."}
          </div>
        ) : filtered.map((u, i) => {
          const initials = u.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "??";
          const rc = ROLE_COLORS[u.role] || ROLE_COLORS.USER;
          return (
            <div key={u.id} className="user-row" style={{ animationDelay:`${i*30}ms` }}>
              {/* Avatar */}
              <div style={{ width:38, height:38, borderRadius:10, flexShrink:0,
                background:"linear-gradient(135deg,#d97706,#f59e0b)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:".78rem", fontWeight:800, color:"#fff",
                boxShadow:"0 3px 10px rgba(217,119,6,.2)" }}>{initials}</div>
              {/* Name */}
              <div>
                <div style={{ fontWeight:700, fontSize:".88rem", color:"#1c1917" }}>{u.name}</div>
                <div style={{ fontSize:".73rem", color:"#a8a29e", fontFamily:"monospace" }}>ID #{u.id}</div>
              </div>
              {/* Email */}
              <div style={{ fontSize:".82rem", color:"#78716c",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.email}</div>
              {/* Role */}
              <div>
                <span style={{ fontSize:".62rem", fontFamily:"monospace", fontWeight:800,
                  color:rc.color, background:rc.bg, border:`1px solid ${rc.border}`,
                  padding:"3px 10px", borderRadius:20 }}>{u.role}</span>
              </div>
            </div>
          );
        })}

        {!loading && (
          <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid #f5f5f4",
            fontSize:".72rem", color:"#a8a29e", fontFamily:"monospace" }}>
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>
    </div>
  );
}