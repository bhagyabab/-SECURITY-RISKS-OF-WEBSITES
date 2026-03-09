import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/manager";

const STATUS_CONFIG = {
  PENDING:  { color:"#d97706", bg:"#fffbeb", border:"#fde68a", icon:"⏳" },
  APPROVED: { color:"#059669", bg:"#f0fdf4", border:"#6ee7b7", icon:"✅" },
  REJECTED: { color:"#ef4444", bg:"#fef2f2", border:"#fecaca", icon:"❌" },
};

export default function ManagerFiles() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [files,    setFiles]    = useState([]);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL");
  const [loading,  setLoading]  = useState(true);
  const [delId,    setDelId]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const [actId,    setActId]    = useState(null); // spinner per row

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/files`, { headers });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (e) { showToast("Failed to load files", "error"); }
    finally { setLoading(false); }
  };

  const approveFile = async (id) => {
    setActId(id);
    try {
      await axios.put(`${API}/file/${id}/approve`, {}, { headers });
      setFiles(f => f.map(x => x.id === id ? { ...x, status:"APPROVED" } : x));
      showToast("File approved!", "success");
    } catch (e) { showToast("Action failed", "error"); }
    finally { setActId(null); }
  };

  const rejectFile = async (id) => {
    setActId(id);
    try {
      await axios.put(`${API}/file/${id}/reject`, {}, { headers });
      setFiles(f => f.map(x => x.id === id ? { ...x, status:"REJECTED" } : x));
      showToast("File rejected.", "success");
    } catch (e) { showToast("Action failed", "error"); }
    finally { setActId(null); }
  };

  const deleteFile = async (id) => {
    try {
      await axios.delete(`${API}/file/${id}`, { headers });
      setFiles(f => f.filter(x => x.id !== id));
      showToast("File deleted.", "success");
    } catch (e) { showToast("Delete failed", "error"); }
    finally { setDelId(null); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const EXT_COLORS = { PDF:"#ef4444",JPG:"#2563eb",JPEG:"#2563eb",PNG:"#059669",DOCX:"#7c3aed",TXT:"#f97316" };
  const getExt   = f => f.fileName?.split(".").pop()?.toUpperCase() || "?";
  const getColor = f => EXT_COLORS[getExt(f)] || "#64748b";

  const counts = {
    ALL:      files.length,
    PENDING:  files.filter(f => f.status === "PENDING").length,
    APPROVED: files.filter(f => f.status === "APPROVED").length,
    REJECTED: files.filter(f => f.status === "REJECTED").length,
  };

  const filtered = files.filter(f => {
    const matchSearch = f.fileName?.toLowerCase().includes(search.toLowerCase()) ||
                        f.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || f.status === filter;
    return matchSearch && matchFilter;
  });

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .search-input { width:100%; padding:10px 16px 10px 40px; border-radius:10px;
      border:1.5px solid #e7e5e4; background:#fff; font-family:'Outfit',sans-serif;
      font-size:.87rem; color:#1c1917; outline:none; transition:border .2s; }
    .search-input:focus { border-color:#d97706; box-shadow:0 0 0 3px rgba(217,119,6,.08); }

    .filter-chip { padding:7px 16px; border-radius:20px; cursor:pointer;
      font-size:.73rem; font-weight:700; font-family:'Outfit',sans-serif;
      border:1.5px solid #e7e5e4; background:#fff; color:#78716c; transition:all .2s; white-space:nowrap; }
    .filter-chip:hover:not(.active) { border-color:#d97706; color:#d97706; }

    .file-row { display:grid; grid-template-columns:36px 1fr 150px 100px 180px;
      align-items:center; gap:12px; padding:13px 16px; border-radius:12px;
      transition:background .15s; animation:fadeUp .4s ease both; }
    .file-row:hover { background:#fffbeb; }

    .approve-btn { padding:5px 12px; border-radius:7px; cursor:pointer; font-size:.72rem;
      font-weight:700; border:1.5px solid #6ee7b7; background:#f0fdf4; color:#059669;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .approve-btn:hover:not(:disabled) { background:#059669; color:#fff; border-color:#059669; }
    .approve-btn:disabled { opacity:.5; cursor:not-allowed; }

    .reject-btn { padding:5px 12px; border-radius:7px; cursor:pointer; font-size:.72rem;
      font-weight:700; border:1.5px solid #fde68a; background:#fffbeb; color:#d97706;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .reject-btn:hover:not(:disabled) { background:#d97706; color:#fff; border-color:#d97706; }
    .reject-btn:disabled { opacity:.5; cursor:not-allowed; }

    .del-btn { padding:5px 10px; border-radius:7px; cursor:pointer; font-size:.72rem;
      font-weight:700; border:1.5px solid #fecaca; background:#fef2f2; color:#ef4444;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .del-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; }

    .confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; backdrop-filter:blur(4px); }
    .confirm-box { background:#fff; border-radius:18px; padding:32px 28px; max-width:360px;
      width:90%; animation:slideIn .3s ease; box-shadow:0 24px 60px rgba(0,0,0,.18); }

    .toast { position:fixed; bottom:28px; right:28px; z-index:9999;
      padding:12px 20px; border-radius:10px; font-size:.84rem; font-weight:600;
      animation:slideIn .3s ease; font-family:'Outfit',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.12); }
    .toast.success { background:#f0fdf4; border:1.5px solid #6ee7b7; color:#059669; }
    .toast.error   { background:#fef2f2; border:1.5px solid #fecaca; color:#ef4444; }
  `;

  const FILTER_TABS = [
    { key:"ALL",      label:`All (${counts.ALL})`,             activeStyle:{ background:"#1c1917", color:"#fff", borderColor:"#1c1917" } },
    { key:"PENDING",  label:`Pending (${counts.PENDING})`,     activeStyle:{ background:"#d97706", color:"#fff", borderColor:"#d97706" } },
    { key:"APPROVED", label:`Approved (${counts.APPROVED})`,   activeStyle:{ background:"#059669", color:"#fff", borderColor:"#059669" } },
    { key:"REJECTED", label:`Rejected (${counts.REJECTED})`,   activeStyle:{ background:"#64748b", color:"#fff", borderColor:"#64748b" } },
  ];

  return (
    <div style={{ padding:"88px 5% 60px", background:"#fff9f0", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {delId && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <div className="bh" style={{ fontSize:"1.4rem", color:"#0f172a", marginBottom:8 }}>Delete File?</div>
            <p style={{ fontSize:".87rem", color:"#64748b", lineHeight:1.75, marginBottom:24 }}>
              This will permanently remove the file from S3 and its record from the database.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDelId(null)} style={{ flex:1, padding:"10px", borderRadius:9,
                border:"1.5px solid #e2e8f0", background:"#fff", cursor:"pointer",
                fontWeight:600, fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#64748b" }}>Cancel</button>
              <button onClick={() => deleteFile(delId)} style={{ flex:1, padding:"10px", borderRadius:9,
                border:"none", background:"#ef4444", cursor:"pointer", fontWeight:700,
                fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#fff" }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:".65rem", color:"#a8a29e", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Manager · File Management</div>
        <div className="bh" style={{ fontSize:"2.2rem", color:"#1c1917" }}>File Management</div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
        {[
          { label:"Total",    value:counts.ALL,      c:"#1c1917" },
          { label:"Pending",  value:counts.PENDING,  c:"#d97706" },
          { label:"Approved", value:counts.APPROVED, c:"#059669" },
          { label:"Rejected", value:counts.REJECTED, c:"#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", borderTop:`3px solid ${s.c}`,
            borderRadius:12, padding:"14px 18px", boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
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

        {/* Search + filter */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#a8a29e" }}>🔍</span>
              <input className="search-input" placeholder="Search by file name or email..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={fetchFiles} style={{ padding:"9px 18px", borderRadius:9,
              border:"1.5px solid #fde68a", background:"#fffbeb", color:"#d97706",
              cursor:"pointer", fontWeight:700, fontSize:".8rem", fontFamily:"'Outfit',sans-serif" }}>↻ Refresh</button>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {FILTER_TABS.map(t => (
              <button key={t.key}
                className="filter-chip"
                style={filter === t.key ? t.activeStyle : {}}
                onClick={() => setFilter(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"36px 1fr 150px 100px 180px",
          gap:12, padding:"8px 16px", borderBottom:"2px solid #f5f5f4", marginBottom:4 }}>
          {["#","File","Uploaded By","Status","Actions"].map(h => (
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
            {search || filter !== "ALL" ? "No files match your filter." : "No files found."}
          </div>
        ) : filtered.map((f, i) => {
          const ext  = getExt(f);
          const ec   = getColor(f);
          const sc   = STATUS_CONFIG[f.status] || STATUS_CONFIG.PENDING;
          const busy = actId === f.id;
          return (
            <div key={f.id} className="file-row" style={{ animationDelay:`${i*30}ms` }}>
              {/* # */}
              <div style={{ fontFamily:"monospace", fontSize:".75rem", color:"#d4d0ca" }}>
                {String(i+1).padStart(2,"0")}
              </div>
              {/* File name */}
              <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                <span style={{ fontSize:".56rem", fontFamily:"monospace", fontWeight:800,
                  color:ec, background:`${ec}10`, border:`1px solid ${ec}28`,
                  padding:"2px 7px", borderRadius:5, flexShrink:0 }}>{ext}</span>
                <span style={{ fontWeight:600, fontSize:".86rem", color:"#1c1917",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.fileName}</span>
              </div>
              {/* Email */}
              <div style={{ fontSize:".81rem", color:"#78716c",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.email}</div>
              {/* Status badge */}
              <div>
                <span style={{ fontSize:".62rem", fontFamily:"monospace", fontWeight:800,
                  color:sc.color, background:sc.bg, border:`1px solid ${sc.border}`,
                  padding:"3px 9px", borderRadius:20, display:"flex", alignItems:"center",
                  gap:4, width:"fit-content" }}>
                  {sc.icon} {f.status}
                </span>
              </div>
              {/* Actions */}
              <div style={{ display:"flex", gap:6 }}>
                {f.status === "PENDING" && (
                  <>
                    <button className="approve-btn" disabled={busy}
                      onClick={() => approveFile(f.id)}>
                      {busy ? "..." : "✓ Approve"}
                    </button>
                    <button className="reject-btn" disabled={busy}
                      onClick={() => rejectFile(f.id)}>
                      {busy ? "..." : "✗ Reject"}
                    </button>
                  </>
                )}
                {f.status === "APPROVED" && (
                  <button className="reject-btn" disabled={busy}
                    onClick={() => rejectFile(f.id)}>
                    {busy ? "..." : "✗ Reject"}
                  </button>
                )}
                {f.status === "REJECTED" && (
                  <button className="approve-btn" disabled={busy}
                    onClick={() => approveFile(f.id)}>
                    {busy ? "..." : "✓ Approve"}
                  </button>
                )}
                <button className="del-btn" onClick={() => setDelId(f.id)}>🗑</button>
              </div>
            </div>
          );
        })}

        {!loading && (
          <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid #f5f5f4",
            fontSize:".72rem", color:"#a8a29e", fontFamily:"monospace" }}>
            Showing {filtered.length} of {files.length} files
          </div>
        )}
      </div>
    </div>
  );
}