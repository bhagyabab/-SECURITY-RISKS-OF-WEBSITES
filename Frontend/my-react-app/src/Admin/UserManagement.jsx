import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/admin";

export default function UserManagement() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Tabs: USERS | MANAGERS
  const [tab, setTab] = useState("USERS");

  // ── Users state
  const [users,      setUsers]      = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userLoading,setUserLoading]= useState(true);
  const [delUserId,  setDelUserId]  = useState(null);

  // ── Managers state
  const [managers,    setManagers]    = useState([]);
  const [mgrSearch,   setMgrSearch]   = useState("");
  const [mgrFilter,   setMgrFilter]   = useState("ALL");
  const [mgrLoading,  setMgrLoading]  = useState(true);
  const [delMgrId,    setDelMgrId]    = useState(null);
  const [actionMgr,   setActionMgr]   = useState(null); // { id, name, action: 'approve'|'reject' }

  // ── Shared
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchUsers(); fetchManagers(); }, []);

  // ── Fetch
  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const res = await axios.get(`${API}/users`, { headers });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) { showToast("Failed to load users", "error"); }
    finally { setUserLoading(false); }
  };

  const fetchManagers = async () => {
    setMgrLoading(true);
    try {
      const res = await axios.get(`${API}/managers`, { headers });
      setManagers(Array.isArray(res.data) ? res.data : []);
    } catch (e) { showToast("Failed to load managers", "error"); }
    finally { setMgrLoading(false); }
  };

  // ── Actions: Users
  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API}/user/${id}`, { headers });
      setUsers(u => u.filter(x => x.id !== id));
      showToast("User deleted successfully", "success");
    } catch (e) { showToast("Failed to delete user", "error"); }
    finally { setDelUserId(null); }
  };

  // ── Actions: Managers
  const approveManager = async (id) => {
    try {
      await axios.put(`${API}/manager/${id}/approve`, {}, { headers });
      setManagers(m => m.map(x => x.id === id ? { ...x, approvalStatus:"APPROVED" } : x));
      showToast("Manager approved! They can now login.", "success");
    } catch (e) { showToast(e.response?.data?.error || "Failed to approve", "error"); }
    finally { setActionMgr(null); }
  };

  const rejectManager = async (id) => {
    try {
      await axios.put(`${API}/manager/${id}/reject`, {}, { headers });
      setManagers(m => m.map(x => x.id === id ? { ...x, approvalStatus:"REJECTED" } : x));
      showToast("Manager rejected.", "success");
    } catch (e) { showToast(e.response?.data?.error || "Failed to reject", "error"); }
    finally { setActionMgr(null); }
  };

  const deleteManager = async (id) => {
    try {
      await axios.delete(`${API}/manager/${id}`, { headers });
      setManagers(m => m.filter(x => x.id !== id));
      showToast("Manager deleted successfully", "success");
    } catch (e) { showToast("Failed to delete manager", "error"); }
    finally { setDelMgrId(null); }
  };

  // ── Toast
  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Filter helpers
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredManagers = managers
    .filter(m => mgrFilter === "ALL" || m.approvalStatus === mgrFilter)
    .filter(m =>
      m.name?.toLowerCase().includes(mgrSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(mgrSearch.toLowerCase())
    );

  const pendingCount  = managers.filter(m => m.approvalStatus === "PENDING").length;
  const approvedCount = managers.filter(m => m.approvalStatus === "APPROVED").length;
  const rejectedCount = managers.filter(m => m.approvalStatus === "REJECTED").length;

  // ── Status badge helper
  const statusBadge = (status) => {
    const map = {
      APPROVED: { c:"#059669", bg:"#f0fdf4", bd:"#6ee7b7" },
      REJECTED: { c:"#ef4444", bg:"#fef2f2", bd:"#fecaca" },
      PENDING:  { c:"#d97706", bg:"#fffbeb", bd:"#fde68a" },
    };
    const s = map[status] || map["PENDING"];
    return (
      <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
        padding:"3px 10px", borderRadius:20,
        background:s.bg, color:s.c, border:`1px solid ${s.bd}` }}>
        {status}
      </span>
    );
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .search-input {
      width:100%; padding:10px 16px 10px 40px; border-radius:10px;
      border:1.5px solid #e2e8f0; background:#fff;
      font-family:'Outfit',sans-serif; font-size:.87rem; color:#0f172a;
      outline:none; transition:border .2s;
    }
    .search-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,.08); }
    .search-input.mgr:focus { border-color:#d97706; box-shadow:0 0 0 3px rgba(217,119,6,.08); }

    .tab-btn {
      padding:9px 22px; border-radius:9px; cursor:pointer; font-weight:700;
      font-size:.82rem; font-family:'Outfit',sans-serif; border:1.5px solid #e2e8f0;
      background:#fff; color:#64748b; transition:all .22s; position:relative;
    }
    .tab-btn.active-users  { background:#eff6ff; color:#2563eb; border-color:#bfdbfe; }
    .tab-btn.active-mgrs   { background:#fffbeb; color:#d97706; border-color:#fde68a; }
    .tab-btn:hover:not(.active-users):not(.active-mgrs) { border-color:#cbd5e1; color:#374151; }

    .filter-chip {
      padding:5px 14px; border-radius:20px; cursor:pointer;
      font-size:.72rem; font-weight:700; font-family:'Outfit',sans-serif;
      border:1.5px solid #e2e8f0; background:#fff; color:#64748b; transition:all .2s;
    }
    .filter-chip.active { background:#d97706; color:#fff; border-color:#d97706; box-shadow:0 3px 10px rgba(217,119,6,.25); }
    .filter-chip.approved.active { background:#059669; border-color:#059669; box-shadow:0 3px 10px rgba(5,150,105,.25); }
    .filter-chip.rejected.active { background:#ef4444; border-color:#ef4444; box-shadow:0 3px 10px rgba(239,68,68,.25); }
    .filter-chip:hover:not(.active) { border-color:#d97706; color:#d97706; }

    .row {
      display:grid; align-items:center; gap:12px; padding:12px 16px;
      border-radius:12px; transition:background .15s; animation:fadeUp .4s ease both;
    }
    .row:hover { background:#f8faff; }

    .del-btn {
      padding:5px 11px; border-radius:7px; cursor:pointer; font-size:.72rem;
      font-weight:700; border:1.5px solid #fecaca; background:#fef2f2; color:#ef4444;
      font-family:'Outfit',sans-serif; transition:all .2s;
    }
    .del-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; }

    .approve-btn {
      padding:5px 11px; border-radius:7px; cursor:pointer; font-size:.72rem;
      font-weight:700; border:1.5px solid #6ee7b7; background:#f0fdf4; color:#059669;
      font-family:'Outfit',sans-serif; transition:all .2s;
    }
    .approve-btn:hover { background:#059669; color:#fff; border-color:#059669; }

    .reject-btn {
      padding:5px 11px; border-radius:7px; cursor:pointer; font-size:.72rem;
      font-weight:700; border:1.5px solid #fed7aa; background:#fff7ed; color:#f97316;
      font-family:'Outfit',sans-serif; transition:all .2s;
    }
    .reject-btn:hover { background:#f97316; color:#fff; border-color:#f97316; }

    .confirm-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,.45);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; backdrop-filter:blur(4px);
    }
    .confirm-box {
      background:#fff; border-radius:18px; padding:32px 28px; max-width:370px;
      width:90%; animation:slideIn .3s ease; box-shadow:0 24px 60px rgba(0,0,0,.18);
    }
    .toast {
      position:fixed; bottom:28px; right:28px; z-index:9999;
      padding:12px 20px; border-radius:10px; font-size:.84rem; font-weight:600;
      animation:slideIn .3s ease; font-family:'Outfit',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.12);
    }
    .toast.success { background:#f0fdf4; border:1.5px solid #6ee7b7; color:#059669; }
    .toast.error   { background:#fef2f2; border:1.5px solid #fecaca; color:#ef4444; }
  `;

  return (
    <div style={{ padding:"88px 5% 60px", background:"#f0f4ff", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* ── Delete User Confirm ── */}
      {delUserId && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
            <div className="bh" style={{ fontSize:"1.4rem", color:"#0f172a", marginBottom:8 }}>Delete User?</div>
            <p style={{ fontSize:".87rem", color:"#64748b", lineHeight:1.75, marginBottom:24 }}>
              This action cannot be undone. The user and all associated data will be permanently removed.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDelUserId(null)} style={{ flex:1, padding:"10px", borderRadius:9,
                border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer",
                fontWeight:600, fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#64748b" }}>Cancel</button>
              <button onClick={() => deleteUser(delUserId)} style={{ flex:1, padding:"10px", borderRadius:9,
                border:"none", background:"#ef4444", cursor:"pointer",
                fontWeight:700, fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#fff" }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Manager Confirm ── */}
      {delMgrId && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <div className="bh" style={{ fontSize:"1.4rem", color:"#0f172a", marginBottom:8 }}>Delete Manager?</div>
            <p style={{ fontSize:".87rem", color:"#64748b", lineHeight:1.75, marginBottom:24 }}>
              This will permanently remove the manager record. They will not be able to log in.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDelMgrId(null)} style={{ flex:1, padding:"10px", borderRadius:9,
                border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer",
                fontWeight:600, fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#64748b" }}>Cancel</button>
              <button onClick={() => deleteManager(delMgrId)} style={{ flex:1, padding:"10px", borderRadius:9,
                border:"none", background:"#ef4444", cursor:"pointer",
                fontWeight:700, fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#fff" }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve / Reject Manager Confirm ── */}
      {actionMgr && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div style={{ fontSize:36, marginBottom:12 }}>{actionMgr.action === "approve" ? "✅" : "❌"}</div>
            <div className="bh" style={{ fontSize:"1.4rem", color:"#0f172a", marginBottom:8 }}>
              {actionMgr.action === "approve" ? "Approve Manager?" : "Reject Manager?"}
            </div>
            <p style={{ fontSize:".87rem", color:"#64748b", lineHeight:1.75, marginBottom:24 }}>
              {actionMgr.action === "approve"
                ? `Approving "${actionMgr.name}" will allow them to log in and manage files.`
                : `Rejecting "${actionMgr.name}" will prevent them from logging in.`}
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setActionMgr(null)} style={{ flex:1, padding:"10px", borderRadius:9,
                border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer",
                fontWeight:600, fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#64748b" }}>Cancel</button>
              <button
                onClick={() => actionMgr.action === "approve" ? approveManager(actionMgr.id) : rejectManager(actionMgr.id)}
                style={{ flex:1, padding:"10px", borderRadius:9, border:"none", cursor:"pointer",
                  fontWeight:700, fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#fff",
                  background: actionMgr.action === "approve" ? "#059669" : "#f97316" }}>
                Yes, {actionMgr.action === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>
          Admin · User Management
        </div>
        <div className="bh" style={{ fontSize:"2.2rem", color:"#0f172a" }}>User Management</div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:10, marginBottom:22 }}>
        <button
          className={`tab-btn${tab === "USERS" ? " active-users" : ""}`}
          onClick={() => setTab("USERS")}>
          👥 Users ({users.length})
        </button>
        <button
          className={`tab-btn${tab === "MANAGERS" ? " active-mgrs" : ""}`}
          onClick={() => setTab("MANAGERS")}>
          ⚙️ Managers ({managers.length})
          {pendingCount > 0 && (
            <span style={{ marginLeft:8, fontSize:".6rem", fontWeight:800,
              background:"#ef4444", color:"#fff", padding:"1px 7px",
              borderRadius:20, fontFamily:"monospace", animation:"blink 2s infinite" }}>
              {pendingCount} PENDING
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════
          USERS TAB
      ══════════════════════════════ */}
      {tab === "USERS" && (
        <>
          {/* Stats */}
          <div style={{ display:"flex", gap:12, marginBottom:20 }}>
            {[
              { label:"Total Users", value:users.length,                            c:"#2563eb" },
              { label:"Web Users",   value:users.filter(u=>u.role!=="ADMIN").length, c:"#059669" },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", borderTop:`3px solid ${s.c}`,
                borderRadius:12, padding:"14px 18px", flex:1,
                boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.8rem",
                  letterSpacing:2, color:"#0f172a" }}>{s.value}</div>
                <div style={{ fontSize:".72rem", fontWeight:700, color:s.c,
                  textTransform:"uppercase", letterSpacing:1.2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background:"#fff", borderRadius:16, padding:"22px",
            boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
            <div style={{ display:"flex", gap:12, marginBottom:20 }}>
              <div style={{ position:"relative", flex:1 }}>
                <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#94a3b8" }}>🔍</span>
                <input className="search-input" placeholder="Search by name or email..."
                  value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <button onClick={fetchUsers} style={{ padding:"9px 18px", borderRadius:9,
                border:"1.5px solid #bfdbfe", background:"#eff6ff", color:"#2563eb",
                cursor:"pointer", fontWeight:700, fontSize:".8rem", fontFamily:"'Outfit',sans-serif" }}>
                ↻ Refresh
              </button>
            </div>

            {/* Table header */}
            <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 1fr 100px 90px",
              gap:12, padding:"8px 16px", borderBottom:"2px solid #f1f5f9", marginBottom:4 }}>
              {["#","Name","Email","Role","Action"].map(h => (
                <div key={h} style={{ fontSize:".62rem", fontWeight:800, color:"#94a3b8",
                  letterSpacing:1.5, fontFamily:"monospace", textTransform:"uppercase" }}>{h}</div>
              ))}
            </div>

            {userLoading ? (
              <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
                <div style={{ width:36, height:36, border:"3px solid #e2e8f0",
                  borderTopColor:"#2563eb", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:".85rem" }}>
                {userSearch ? "No users match your search." : "No users found."}
              </div>
            ) : filteredUsers.map((u, i) => {
              const palette = ["#2563eb","#7c3aed","#059669","#f97316","#0891b2","#ef4444"];
              const c = palette[i % palette.length];
              const isAdmin = u.role === "ADMIN";
              return (
                <div key={u.id} className="row"
                  style={{ gridTemplateColumns:"40px 1fr 1fr 100px 90px", animationDelay:`${i*35}ms` }}>
                  <div style={{ fontFamily:"monospace", fontSize:".75rem", color:"#cbd5e1" }}>
                    {String(i+1).padStart(2,"0")}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                    <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                      background:`${c}12`, border:`1.5px solid ${c}25`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:800, fontSize:".88rem", color:c }}>
                      {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <span style={{ fontWeight:700, fontSize:".86rem", color:"#0f172a",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.name}</span>
                  </div>
                  <div style={{ fontSize:".83rem", color:"#64748b",
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.email}</div>
                  <div>
                    <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                      padding:"3px 10px", borderRadius:20,
                      background: isAdmin ? "#eff6ff" : "#f0fdf4",
                      color:       isAdmin ? "#2563eb" : "#059669",
                      border:      isAdmin ? "1px solid #bfdbfe" : "1px solid #6ee7b7" }}>
                      {u.role || "USER"}
                    </span>
                  </div>
                  <div>
                    {isAdmin
                      ? <span style={{ fontSize:".7rem", color:"#94a3b8", fontStyle:"italic" }}>Protected</span>
                      : <button className="del-btn" onClick={() => setDelUserId(u.id)}>Delete</button>
                    }
                  </div>
                </div>
              );
            })}

            {!userLoading && (
              <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid #f1f5f9",
                fontSize:".72rem", color:"#94a3b8", fontFamily:"monospace" }}>
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════
          MANAGERS TAB
      ══════════════════════════════ */}
      {tab === "MANAGERS" && (
        <>
          {/* Stats */}
          <div style={{ display:"flex", gap:12, marginBottom:20 }}>
            {[
              { label:"Total",    value:managers.length, c:"#d97706" },
              { label:"Pending",  value:pendingCount,    c:"#ef4444" },
              { label:"Approved", value:approvedCount,   c:"#059669" },
              { label:"Rejected", value:rejectedCount,   c:"#64748b" },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", borderTop:`3px solid ${s.c}`,
                borderRadius:12, padding:"14px 18px", flex:1,
                boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.8rem",
                  letterSpacing:2, color:"#0f172a" }}>{s.value}</div>
                <div style={{ fontSize:".72rem", fontWeight:700, color:s.c,
                  textTransform:"uppercase", letterSpacing:1.2 }}>{s.label} Managers</div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div style={{ background:"#fff", borderRadius:16, padding:"22px",
            boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>

            {/* Search + filter chips + refresh */}
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              <div style={{ display:"flex", gap:12 }}>
                <div style={{ position:"relative", flex:1 }}>
                  <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#94a3b8" }}>🔍</span>
                  <input className="search-input mgr" placeholder="Search managers by name or email..."
                    value={mgrSearch} onChange={e => setMgrSearch(e.target.value)} />
                </div>
                <button onClick={fetchManagers} style={{ padding:"9px 18px", borderRadius:9,
                  border:"1.5px solid #fde68a", background:"#fffbeb", color:"#d97706",
                  cursor:"pointer", fontWeight:700, fontSize:".8rem", fontFamily:"'Outfit',sans-serif" }}>
                  ↻ Refresh
                </button>
              </div>
              {/* Status filter chips */}
              <div style={{ display:"flex", gap:8 }}>
                {["ALL","PENDING","APPROVED","REJECTED"].map(f => (
                  <button key={f}
                    className={`filter-chip${mgrFilter===f ? ` active${f==="APPROVED"?" approved":f==="REJECTED"?" rejected":""}` : ""}`}
                    onClick={() => setMgrFilter(f)}>
                    {f === "ALL" ? `All (${managers.length})`
                      : f === "PENDING"  ? `Pending (${pendingCount})`
                      : f === "APPROVED" ? `Approved (${approvedCount})`
                      : `Rejected (${rejectedCount})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Table header */}
            <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 1fr 110px 180px",
              gap:12, padding:"8px 16px", borderBottom:"2px solid #f1f5f9", marginBottom:4 }}>
              {["#","Name","Email","Status","Actions"].map(h => (
                <div key={h} style={{ fontSize:".62rem", fontWeight:800, color:"#94a3b8",
                  letterSpacing:1.5, fontFamily:"monospace", textTransform:"uppercase" }}>{h}</div>
              ))}
            </div>

            {mgrLoading ? (
              <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
                <div style={{ width:36, height:36, border:"3px solid #e2e8f0",
                  borderTopColor:"#d97706", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              </div>
            ) : filteredManagers.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:".85rem" }}>
                {mgrSearch || mgrFilter !== "ALL" ? "No managers match your filter." : "No managers registered yet."}
              </div>
            ) : filteredManagers.map((m, i) => (
              <div key={m.id} className="row"
                style={{ gridTemplateColumns:"40px 1fr 1fr 110px 180px", animationDelay:`${i*35}ms` }}>
                <div style={{ fontFamily:"monospace", fontSize:".75rem", color:"#cbd5e1" }}>
                  {String(i+1).padStart(2,"0")}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                  <div style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                    background:"#fffbeb", border:"1.5px solid #fde68a",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:800, fontSize:".88rem", color:"#d97706" }}>
                    {m.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span style={{ fontWeight:700, fontSize:".86rem", color:"#0f172a",
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.name}</span>
                </div>
                <div style={{ fontSize:".83rem", color:"#64748b",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{m.email}</div>
                <div>{statusBadge(m.approvalStatus)}</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {m.approvalStatus === "PENDING" && (
                    <>
                      <button className="approve-btn"
                        onClick={() => setActionMgr({ id:m.id, name:m.name, action:"approve" })}>
                        Approve
                      </button>
                      <button className="reject-btn"
                        onClick={() => setActionMgr({ id:m.id, name:m.name, action:"reject" })}>
                        Reject
                      </button>
                    </>
                  )}
                  {m.approvalStatus === "APPROVED" && (
                    <button className="reject-btn"
                      onClick={() => setActionMgr({ id:m.id, name:m.name, action:"reject" })}>
                      Revoke
                    </button>
                  )}
                  {m.approvalStatus === "REJECTED" && (
                    <button className="approve-btn"
                      onClick={() => setActionMgr({ id:m.id, name:m.name, action:"approve" })}>
                      Re-approve
                    </button>
                  )}
                  <button className="del-btn" onClick={() => setDelMgrId(m.id)}>Delete</button>
                </div>
              </div>
            ))}

            {!mgrLoading && (
              <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid #f1f5f9",
                fontSize:".72rem", color:"#94a3b8", fontFamily:"monospace" }}>
                Showing {filteredManagers.length} of {managers.length} managers
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}