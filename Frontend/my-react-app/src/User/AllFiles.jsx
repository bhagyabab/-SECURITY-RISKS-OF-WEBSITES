import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/user";

export default function AllFiles() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [files,    setFiles]    = useState([]);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL"); // ALL | MINE | OTHERS | APPROVED
  const [loading,  setLoading]  = useState(true);
  const [actId,    setActId]    = useState(null); // in-flight request
  const [toast,    setToast]    = useState(null);

  // Download shared file modal
  const [dlFile,    setDlFile]    = useState(null);
  const [dlLoading, setDlLoading] = useState(false);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/all-files`, { headers });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (e) { showToast("Failed to load files", "error"); }
    finally { setLoading(false); }
  };

  const requestAccess = async (fileId) => {
    setActId(fileId);
    try {
      await axios.post(`${API}/request-access/${fileId}`, {}, { headers });
      setFiles(prev => prev.map(f =>
        f.id === fileId ? { ...f, requestStatus:"PENDING" } : f
      ));
      showToast("Access requested! Waiting for owner approval.", "success");
    } catch (e) {
      showToast(e.response?.data?.error || "Request failed", "error");
    } finally { setActId(null); }
  };

  const downloadShared = async () => {
    if (!dlFile) return;
    setDlLoading(true);
    try {
      const res = await axios.get(`${API}/download/shared/${dlFile.id}`, {
        headers,
        responseType:"blob",
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url; link.setAttribute("download", dlFile.fileName);
      document.body.appendChild(link); link.click();
      link.remove(); window.URL.revokeObjectURL(url);
      showToast("File downloaded successfully!", "success");
      setDlFile(null);
    } catch (e) { showToast("Download failed.", "error"); }
    finally { setDlLoading(false); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const EXT_COLORS = { PDF:"#ef4444",JPG:"#2563eb",JPEG:"#2563eb",PNG:"#059669",DOCX:"#7c3aed",TXT:"#f97316" };
  const getExt   = f => f.fileName?.split(".").pop()?.toUpperCase() || "?";
  const getColor = f => EXT_COLORS[getExt(f)] || "#64748b";

  const filtered = files.filter(f => {
    // Non-owners can only see Manager-APPROVED files
    const isVisible = f.isOwner || f.status === "APPROVED";

    const matchSearch = f.fileName?.toLowerCase().includes(search.toLowerCase()) ||
                        f.ownerEmail?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "ALL"      ? true :
      filter === "MINE"     ? f.isOwner :
      filter === "OTHERS"   ? !f.isOwner :
      filter === "APPROVED" ? f.canDownload && !f.isOwner :
      true;
    return isVisible && matchSearch && matchFilter;
  });

  const myCount       = files.filter(f => f.isOwner).length;
  const othersCount   = files.filter(f => !f.isOwner && f.status === "APPROVED").length;
  const approvedCount = files.filter(f => f.canDownload && !f.isOwner).length;
  const pendingCount  = files.filter(f => f.requestStatus === "PENDING").length;

  // Button logic per file
  const getActionButton = (f) => {
    if (f.isOwner) return null; // owner has no action needed

    if (f.canDownload) return (
      <button className="dl-btn" onClick={() => setDlFile(f)}>
        ⬇ Download
      </button>
    );

    if (f.requestStatus === "PENDING") return (
      <button disabled style={{
        padding:"7px 14px", borderRadius:8, fontSize:".75rem", fontWeight:700,
        border:"1.5px solid #fde68a", background:"#fffbeb", color:"#d97706",
        fontFamily:"'Outfit',sans-serif", cursor:"not-allowed", opacity:.8
      }}>⏳ Requested</button>
    );

    if (f.requestStatus === "REJECTED") return (
      <button className="req-btn"
        disabled={actId === f.id}
        onClick={() => requestAccess(f.id)}>
        {actId === f.id ? "..." : "🔄 Re-request"}
      </button>
    );

    // null — never requested
    return (
      <button className="req-btn"
        disabled={actId === f.id}
        onClick={() => requestAccess(f.id)}>
        {actId === f.id ? "Requesting..." : "🔐 Request Access"}
      </button>
    );
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .search-input { width:100%; padding:10px 16px 10px 40px; border-radius:10px;
      border:1.5px solid #e2e8f0; background:#fff; font-family:'Outfit',sans-serif;
      font-size:.87rem; color:#0f172a; outline:none; transition:border .2s; }
    .search-input:focus { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,.08); }

    .filter-chip { padding:6px 14px; border-radius:20px; cursor:pointer;
      font-size:.72rem; font-weight:700; font-family:'Outfit',sans-serif;
      border:1.5px solid #e2e8f0; background:#fff; color:#64748b;
      transition:all .2s; white-space:nowrap; }
    .filter-chip.active { background:#0f172a; color:#fff; border-color:#0f172a;
      box-shadow:0 3px 10px rgba(15,23,42,.2); }
    .filter-chip:hover:not(.active) { border-color:#0f172a; color:#0f172a; }

    .file-card { background:#fff; border-radius:14px; padding:18px 20px;
      border:1.5px solid #f1f5f9; transition:all .25s;
      box-shadow:0 1px 8px rgba(0,0,0,.04); animation:fadeUp .4s ease both; }
    .file-card:hover { border-color:#cbd5e1; transform:translateY(-3px);
      box-shadow:0 10px 28px rgba(0,0,0,.08); }
    .file-card.mine { border-color:#6ee7b7; }
    .file-card.mine:hover { border-color:#059669; }
    .file-card.approved { border-color:#bfdbfe; }
    .file-card.approved:hover { border-color:#2563eb; }

    .dl-btn { padding:7px 14px; border-radius:8px; cursor:pointer; font-size:.75rem;
      font-weight:700; border:1.5px solid #6ee7b7; background:#f0fdf4; color:#059669;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .dl-btn:hover { background:#059669; color:#fff; border-color:#059669; }

    .req-btn { padding:7px 14px; border-radius:8px; cursor:pointer; font-size:.75rem;
      font-weight:700; border:1.5px solid #bfdbfe; background:#eff6ff; color:#2563eb;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .req-btn:hover:not(:disabled) { background:#2563eb; color:#fff; border-color:#2563eb; }
    .req-btn:disabled { opacity:.6; cursor:not-allowed; }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; backdrop-filter:blur(4px); }
    .modal-box { background:#fff; border-radius:18px; padding:32px 28px; max-width:380px;
      width:90%; animation:slideIn .3s ease; box-shadow:0 24px 60px rgba(0,0,0,.18); }

    .toast { position:fixed; bottom:28px; right:28px; z-index:9999;
      padding:12px 20px; border-radius:10px; font-size:.84rem; font-weight:600;
      animation:slideIn .3s ease; font-family:'Outfit',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.12); }
    .toast.success { background:#f0fdf4; border:1.5px solid #6ee7b7; color:#059669; }
    .toast.error   { background:#fef2f2; border:1.5px solid #fecaca; color:#ef4444; }
  `;

  return (
    <div style={{ padding:"88px 5% 60px", background:"#f0f4ff", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Download shared modal */}
      {dlFile && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ fontSize:32, marginBottom:12 }}>⬇️</div>
            <div className="bh" style={{ fontSize:"1.4rem", color:"#0f172a", marginBottom:4 }}>Download File</div>
            <p style={{ fontSize:".8rem", color:"#64748b", marginBottom:6, lineHeight:1.7 }}>
              You have approved access to download:
            </p>
            <p style={{ fontSize:".88rem", fontWeight:700, color:"#0f172a", marginBottom:20 }}>
              "{dlFile.fileName}"
            </p>
            <div style={{ padding:"10px 14px", background:"#eff6ff", border:"1px solid #bfdbfe",
              borderRadius:8, marginBottom:20, fontSize:".78rem", color:"#2563eb" }}>
              ℹ️ This file will be decrypted using the owner's stored key.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDlFile(null)} style={{
                flex:1, padding:"10px", borderRadius:9, border:"1.5px solid #e2e8f0",
                background:"#fff", cursor:"pointer", fontWeight:600,
                fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#64748b" }}>Cancel</button>
              <button onClick={downloadShared} disabled={dlLoading} style={{
                flex:1, padding:"10px", borderRadius:9, border:"none",
                background:"linear-gradient(135deg,#2563eb,#7c3aed)",
                cursor:"pointer", fontWeight:700, fontSize:".84rem",
                fontFamily:"'Outfit',sans-serif", color:"#fff", opacity:dlLoading ? .6 : 1 }}>
                {dlLoading ? "Downloading..." : "⬇ Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>User · All Files</div>
        <div className="bh" style={{ fontSize:"2.2rem", color:"#0f172a" }}>All Files</div>
        <p style={{ fontSize:".84rem", color:"#64748b", marginTop:4 }}>
          Browse all uploaded files. Request access to download files from other users.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
        {[
          { label:"Total Files",     value:files.length,    c:"#0f172a" },
          { label:"My Files",        value:myCount,         c:"#059669" },
          { label:"Others' Files",   value:othersCount,     c:"#2563eb" },
          { label:"Access Approved", value:approvedCount,   c:"#7c3aed",
            extra: pendingCount > 0 ? `${pendingCount} pending` : null },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", borderTop:`3px solid ${s.c}`,
            borderRadius:12, padding:"14px 18px", boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.8rem",
              letterSpacing:2, color:"#0f172a" }}>{s.value}</div>
            <div style={{ fontSize:".72rem", fontWeight:700, color:s.c,
              textTransform:"uppercase", letterSpacing:1.2 }}>{s.label}</div>
            {s.extra && (
              <div style={{ marginTop:4, fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                color:"#f97316", display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"#f97316",
                  display:"inline-block", animation:"blink 1.5s infinite" }} />
                {s.extra}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ background:"#fff", borderRadius:14, padding:"16px 20px",
        boxShadow:"0 1px 10px rgba(0,0,0,.05)", marginBottom:18 }}>
        <div style={{ display:"flex", gap:12, marginBottom:12 }}>
          <div style={{ position:"relative", flex:1 }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#94a3b8" }}>🔍</span>
            <input className="search-input" placeholder="Search by file name or owner email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={fetchFiles} style={{ padding:"9px 18px", borderRadius:9,
            border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b",
            cursor:"pointer", fontWeight:700, fontSize:".8rem", fontFamily:"'Outfit',sans-serif" }}>↻ Refresh</button>
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {[
            { key:"ALL",      label:`All (${files.length})` },
            { key:"MINE",     label:`Mine (${myCount})` },
            { key:"OTHERS",   label:`Others (${othersCount})` },
            { key:"APPROVED", label:`Can Download (${approvedCount})` },
          ].map(c => (
            <button key={c.key} className={`filter-chip${filter===c.key?" active":""}`}
              onClick={() => setFilter(c.key)}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* How it works info */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
        background:"#eff6ff", border:"1.5px solid #bfdbfe", borderRadius:10, marginBottom:20 }}>
        <span style={{ fontSize:16 }}>ℹ️</span>
        <span style={{ fontSize:".78rem", color:"#1e40af", fontWeight:600 }}>
          Only <strong>Manager-approved files</strong> are visible here. To download someone else's file, click <strong>"Request Access"</strong> — the file owner must approve your request before you can download.
        </span>
      </div>

      {/* Files grid */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
          <div style={{ width:40, height:40, border:"3px solid #e2e8f0",
            borderTopColor:"#059669", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:16, padding:"60px 0",
          textAlign:"center", boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
          <div style={{ fontSize:".9rem", fontWeight:600, color:"#374151" }}>
            {search || filter !== "ALL" ? "No files match your filter." : "No files found."}
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
          {filtered.map((f, i) => {
            const ext = getExt(f); const ec = getColor(f);
            const cardClass = f.isOwner ? "file-card mine" : f.canDownload ? "file-card approved" : "file-card";
            const actionBtn = getActionButton(f);

            return (
              <div key={f.id} className={cardClass} style={{ animationDelay:`${i*30}ms` }}>
                {/* Top row */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                    color:ec, background:`${ec}12`, border:`1.5px solid ${ec}28`,
                    padding:"3px 10px", borderRadius:6 }}>{ext}</span>
                  <div style={{ display:"flex", gap:5 }}>
                    {f.isOwner && (
                      <span style={{ fontSize:".58rem", fontFamily:"monospace", fontWeight:800,
                        color:"#059669", background:"#f0fdf4", border:"1px solid #6ee7b7",
                        padding:"2px 8px", borderRadius:20 }}>MY FILE</span>
                    )}
                    {f.canDownload && !f.isOwner && (
                      <span style={{ fontSize:".58rem", fontFamily:"monospace", fontWeight:800,
                        color:"#2563eb", background:"#eff6ff", border:"1px solid #bfdbfe",
                        padding:"2px 8px", borderRadius:20 }}>ACCESS ✓</span>
                    )}
                    {f.requestStatus === "PENDING" && (
                      <span style={{ fontSize:".58rem", fontFamily:"monospace", fontWeight:800,
                        color:"#d97706", background:"#fffbeb", border:"1px solid #fde68a",
                        padding:"2px 8px", borderRadius:20,
                        display:"flex", alignItems:"center", gap:3 }}>
                        <span style={{ width:4, height:4, borderRadius:"50%", background:"#d97706",
                          animation:"blink 1.2s infinite" }} />
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                {/* File name */}
                <div style={{ fontWeight:700, fontSize:".9rem", color:"#0f172a", marginBottom:4,
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                  {f.fileName}
                </div>

                {/* Owner email */}
                <div style={{ fontSize:".73rem", color:"#94a3b8", marginBottom:4, fontFamily:"monospace" }}>
                  {f.isOwner ? "👤 You" : `👤 ${f.ownerEmail}`}
                </div>

                {/* File status badge */}
                <div style={{ marginBottom:14 }}>
                  <span style={{
                    fontSize:".58rem", fontFamily:"monospace", fontWeight:700,
                    padding:"2px 8px", borderRadius:20,
                    color: f.status==="APPROVED" ? "#059669" : f.status==="REJECTED" ? "#ef4444" : "#d97706",
                    background: f.status==="APPROVED" ? "#f0fdf4" : f.status==="REJECTED" ? "#fef2f2" : "#fffbeb",
                    border: f.status==="APPROVED" ? "1px solid #6ee7b7" : f.status==="REJECTED" ? "1px solid #fecaca" : "1px solid #fde68a",
                  }}>{f.status}</span>
                </div>

                {/* Action button */}
                {actionBtn && <div>{actionBtn}</div>}
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ marginTop:20, fontSize:".72rem", color:"#94a3b8", fontFamily:"monospace", textAlign:"center" }}>
          Showing {filtered.length} of {files.length} files
        </div>
      )}
    </div>
  );
}