import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/user";

export default function MyFiles() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [tab,     setTab]     = useState("MY_FILES"); // MY_FILES | REQUESTS

  // My Files tab
  const [files,     setFiles]     = useState([]);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [delId,     setDelId]     = useState(null);
  const [dlFile,    setDlFile]    = useState(null);
  const [dlKey,     setDlKey]     = useState("");
  const [dlLoading, setDlLoading] = useState(false);

  // Access Requests tab
  const [reqTab,    setReqTab]    = useState("INCOMING"); // INCOMING | OUTGOING
  const [incoming,  setIncoming]  = useState([]);
  const [outgoing,  setOutgoing]  = useState([]);
  const [reqLoad,   setReqLoad]   = useState(false);
  const [actId,     setActId]     = useState(null); // in-flight approve/reject

  const [toast, setToast] = useState(null);

  useEffect(() => { fetchFiles(); }, []);
  useEffect(() => { if (tab === "REQUESTS") fetchRequests(); }, [tab]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/files`, { headers });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (e) { showToast("Failed to load files", "error"); }
    finally { setLoading(false); }
  };

  const fetchRequests = async () => {
    setReqLoad(true);
    try {
      const [inRes, outRes] = await Promise.all([
        axios.get(`${API}/access-requests/incoming`, { headers }),
        axios.get(`${API}/access-requests/outgoing`, { headers }),
      ]);
      setIncoming(Array.isArray(inRes.data)  ? inRes.data  : []);
      setOutgoing(Array.isArray(outRes.data) ? outRes.data : []);
    } catch (e) { showToast("Failed to load requests", "error"); }
    finally { setReqLoad(false); }
  };

  const deleteFile = async (id) => {
    try {
      await axios.delete(`${API}/file/${id}`, { headers });
      setFiles(f => f.filter(x => x.id !== id));
      showToast("File deleted successfully", "success");
    } catch (e) { showToast("Failed to delete file", "error"); }
    finally { setDelId(null); }
  };

  const downloadFile = async () => {
    if (!dlKey) { showToast("Enter your secret key to decrypt", "error"); return; }
    setDlLoading(true);
    try {
      const res = await axios.get(`${API}/download/${dlFile.fileName}`, {
        headers: { ...headers, "X-Secret-Key": dlKey },
        responseType: "blob",
      });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url; link.setAttribute("download", dlFile.fileName);
      document.body.appendChild(link); link.click();
      link.remove(); window.URL.revokeObjectURL(url);
      showToast("File downloaded!", "success");
      setDlFile(null); setDlKey("");
    } catch (e) { showToast("Download failed. Check your secret key.", "error"); }
    finally { setDlLoading(false); }
  };

  const approveRequest = async (requestId) => {
    setActId(requestId);
    try {
      await axios.put(`${API}/access-requests/${requestId}/approve`, {}, { headers });
      setIncoming(prev => prev.map(r => r.requestId === requestId ? { ...r, status:"APPROVED" } : r));
      showToast("Access granted successfully!", "success");
    } catch (e) { showToast(e.response?.data?.error || "Failed to approve", "error"); }
    finally { setActId(null); }
  };

  const rejectRequest = async (requestId) => {
    setActId(requestId);
    try {
      await axios.put(`${API}/access-requests/${requestId}/reject`, {}, { headers });
      setIncoming(prev => prev.map(r => r.requestId === requestId ? { ...r, status:"REJECTED" } : r));
      showToast("Request rejected.", "success");
    } catch (e) { showToast(e.response?.data?.error || "Failed to reject", "error"); }
    finally { setActId(null); }
  };

  const showToast = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const EXT_COLORS = { PDF:"#ef4444",JPG:"#2563eb",JPEG:"#2563eb",PNG:"#059669",DOCX:"#7c3aed",TXT:"#f97316" };
  const getExt   = f => f.fileName?.split(".").pop()?.toUpperCase() || "?";
  const getColor = f => EXT_COLORS[getExt(f)] || "#64748b";
  const filtered = files.filter(f => f.fileName?.toLowerCase().includes(search.toLowerCase()));

  const pendingIncoming = incoming.filter(r => r.status === "PENDING").length;

  const STATUS_STYLE = {
    PENDING:  { color:"#d97706", bg:"#fffbeb", border:"#fde68a",  label:"PENDING"  },
    APPROVED: { color:"#059669", bg:"#f0fdf4", border:"#6ee7b7",  label:"APPROVED" },
    REJECTED: { color:"#ef4444", bg:"#fef2f2", border:"#fecaca",  label:"REJECTED" },
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

    .file-card { background:#fff; border-radius:14px; padding:18px 20px;
      border:1.5px solid #f1f5f9; transition:all .25s;
      box-shadow:0 1px 8px rgba(0,0,0,.04); animation:fadeUp .4s ease both; }
    .file-card:hover { border-color:#6ee7b7; transform:translateY(-3px);
      box-shadow:0 10px 28px rgba(0,0,0,.08); }

    .dl-btn { padding:7px 14px; border-radius:8px; cursor:pointer; font-size:.75rem;
      font-weight:700; border:1.5px solid #6ee7b7; background:#f0fdf4; color:#059669;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .dl-btn:hover { background:#059669; color:#fff; border-color:#059669; }
    .del-btn { padding:7px 14px; border-radius:8px; cursor:pointer; font-size:.75rem;
      font-weight:700; border:1.5px solid #fecaca; background:#fef2f2; color:#ef4444;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .del-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; }

    .approve-btn { padding:7px 14px; border-radius:8px; cursor:pointer; font-size:.75rem;
      font-weight:700; border:1.5px solid #6ee7b7; background:#f0fdf4; color:#059669;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .approve-btn:hover { background:#059669; color:#fff; border-color:#059669; }
    .approve-btn:disabled { opacity:.5; cursor:not-allowed; }
    .reject-btn { padding:7px 14px; border-radius:8px; cursor:pointer; font-size:.75rem;
      font-weight:700; border:1.5px solid #fecaca; background:#fef2f2; color:#ef4444;
      font-family:'Outfit',sans-serif; transition:all .2s; }
    .reject-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; }
    .reject-btn:disabled { opacity:.5; cursor:not-allowed; }

    .req-card { background:#fff; border-radius:14px; padding:16px 18px;
      border-left:3px solid var(--rc); box-shadow:0 1px 8px rgba(0,0,0,.04);
      transition:all .25s; animation:fadeUp .4s ease both; }
    .req-card:hover { transform:translateX(4px); box-shadow:0 6px 20px rgba(0,0,0,.08); }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; backdrop-filter:blur(4px); }
    .modal-box { background:#fff; border-radius:18px; padding:32px 28px; max-width:380px;
      width:90%; animation:slideIn .3s ease; box-shadow:0 24px 60px rgba(0,0,0,.18); }
    .inp { width:100%; padding:11px 16px; border-radius:10px; border:1.5px solid #e2e8f0;
      background:#fff; font-family:'Outfit',sans-serif; font-size:.87rem; color:#0f172a;
      outline:none; transition:border .2s; }
    .inp:focus { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,.08); }

    .toast { position:fixed; bottom:28px; right:28px; z-index:9999;
      padding:12px 20px; border-radius:10px; font-size:.84rem; font-weight:600;
      animation:slideIn .3s ease; font-family:'Outfit',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.12); }
    .toast.success { background:#f0fdf4; border:1.5px solid #6ee7b7; color:#059669; }
    .toast.error   { background:#fef2f2; border:1.5px solid #fecaca; color:#ef4444; }

    .tab-btn { padding:9px 20px; border-radius:9px; cursor:pointer; font-size:.82rem;
      font-weight:700; font-family:'Outfit',sans-serif; border:1.5px solid #e2e8f0;
      background:#fff; color:#64748b; transition:all .22s; display:flex; align-items:center; gap:7px; }
    .tab-btn.active { background:#059669; color:#fff; border-color:#059669;
      box-shadow:0 4px 14px rgba(5,150,105,.25); }
    .tab-btn:hover:not(.active) { border-color:#059669; color:#059669; }

    .sub-tab { padding:6px 16px; border-radius:8px; cursor:pointer; font-size:.78rem;
      font-weight:700; font-family:'Outfit',sans-serif; border:1.5px solid #e2e8f0;
      background:#fff; color:#64748b; transition:all .2s; }
    .sub-tab.active { background:#0f172a; color:#fff; border-color:#0f172a; }
    .sub-tab:hover:not(.active) { border-color:#0f172a; color:#0f172a; }
  `;

  return (
    <div style={{ padding:"88px 5% 60px", background:"#f0f4ff", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Delete confirm modal */}
      {delId && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
            <div className="bh" style={{ fontSize:"1.4rem", color:"#0f172a", marginBottom:8 }}>Delete File?</div>
            <p style={{ fontSize:".87rem", color:"#64748b", lineHeight:1.75, marginBottom:24 }}>
              This file will be permanently deleted from S3 and cannot be recovered.
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

      {/* Download modal */}
      {dlFile && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ fontSize:32, marginBottom:12 }}>🔐</div>
            <div className="bh" style={{ fontSize:"1.4rem", color:"#0f172a", marginBottom:4 }}>Decrypt & Download</div>
            <p style={{ fontSize:".8rem", color:"#64748b", marginBottom:18, lineHeight:1.7 }}>
              Enter the secret key you used when uploading <strong>"{dlFile.fileName}"</strong>
            </p>
            <input className="inp" type="password" placeholder="Enter your secret key..."
              value={dlKey} onChange={e => setDlKey(e.target.value)} style={{ marginBottom:18 }} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { setDlFile(null); setDlKey(""); }} style={{
                flex:1, padding:"10px", borderRadius:9, border:"1.5px solid #e2e8f0",
                background:"#fff", cursor:"pointer", fontWeight:600,
                fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#64748b" }}>Cancel</button>
              <button onClick={downloadFile} disabled={dlLoading} style={{
                flex:1, padding:"10px", borderRadius:9, border:"none",
                background:"linear-gradient(135deg,#059669,#0891b2)",
                cursor:"pointer", fontWeight:700, fontSize:".84rem",
                fontFamily:"'Outfit',sans-serif", color:"#fff", opacity:dlLoading ? .6 : 1 }}>
                {dlLoading ? "Decrypting..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>User · My Files</div>
        <div className="bh" style={{ fontSize:"2.2rem", color:"#0f172a" }}>My Files</div>
      </div>

      {/* Main tabs */}
      <div style={{ display:"flex", gap:10, marginBottom:24 }}>
        <button className={`tab-btn${tab==="MY_FILES"?" active":""}`} onClick={() => setTab("MY_FILES")}>
          📁 My Files
          <span style={{ fontSize:".65rem", background: tab==="MY_FILES"?"rgba(255,255,255,.25)":"#f1f5f9",
            color: tab==="MY_FILES"?"#fff":"#64748b", padding:"1px 8px", borderRadius:20,
            fontFamily:"monospace", fontWeight:800 }}>{files.length}</span>
        </button>
        <button className={`tab-btn${tab==="REQUESTS"?" active":""}`} onClick={() => setTab("REQUESTS")}
          style={ tab==="REQUESTS" ? {} : {} }>
          🤝 Access Requests
          {pendingIncoming > 0 && (
            <span style={{ fontSize:".65rem", background:"#ef4444", color:"#fff",
              padding:"1px 8px", borderRadius:20, fontFamily:"monospace", fontWeight:800,
              animation:"blink 1.5s infinite" }}>{pendingIncoming}</span>
          )}
        </button>
      </div>

      {/* ═══ MY FILES TAB ═══ */}
      {tab === "MY_FILES" && (
        <>
          {/* Stats */}
          <div style={{ display:"flex", gap:12, marginBottom:22 }}>
            {[
              { label:"Total Files", value:files.length,  c:"#059669" },
              { label:"Storage",     value:(files.reduce((a,f)=>a+(f.fileSize||0),0)/1024).toFixed(1)+" KB", c:"#0891b2" },
              { label:"Encrypted",   value:files.length,  c:"#7c3aed" },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", borderTop:`3px solid ${s.c}`,
                borderRadius:12, padding:"14px 18px", flex:1, boxShadow:"0 1px 8px rgba(0,0,0,.04)" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"1.8rem",
                  letterSpacing:2, color:"#0f172a" }}>{s.value}</div>
                <div style={{ fontSize:".72rem", fontWeight:700, color:s.c,
                  textTransform:"uppercase", letterSpacing:1.2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ background:"#fff", borderRadius:14, padding:"16px 20px",
            boxShadow:"0 1px 10px rgba(0,0,0,.05)", marginBottom:18 }}>
            <div style={{ display:"flex", gap:12 }}>
              <div style={{ position:"relative", flex:1 }}>
                <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:15, color:"#94a3b8" }}>🔍</span>
                <input className="search-input" placeholder="Search your files..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={fetchFiles} style={{ padding:"9px 18px", borderRadius:9,
                border:"1.5px solid #6ee7b7", background:"#f0fdf4", color:"#059669",
                cursor:"pointer", fontWeight:700, fontSize:".8rem", fontFamily:"'Outfit',sans-serif" }}>↻ Refresh</button>
            </div>
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
              <div style={{ fontSize:".9rem", fontWeight:600, color:"#374151", marginBottom:6 }}>
                {search ? "No files match your search." : "No files uploaded yet."}
              </div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {filtered.map((f, i) => {
                const ext = getExt(f); const ec = getColor(f);
                return (
                  <div key={f.id} className="file-card" style={{ animationDelay:`${i*35}ms` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                      <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                        color:ec, background:`${ec}12`, border:`1.5px solid ${ec}28`,
                        padding:"3px 10px", borderRadius:6 }}>{ext}</span>
                      <span style={{ fontSize:".58rem", fontFamily:"monospace", fontWeight:700,
                        color:"#059669", background:"#f0fdf4", border:"1px solid #6ee7b7",
                        padding:"2px 8px", borderRadius:20 }}>ENCRYPTED</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:".9rem", color:"#0f172a", marginBottom:4,
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.fileName}</div>
                    <div style={{ fontSize:".74rem", color:"#94a3b8", marginBottom:16, fontFamily:"monospace" }}>
                      {f.fileSize ? (f.fileSize/1024).toFixed(1)+" KB" : "Size unknown"}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className="dl-btn" onClick={() => { setDlFile(f); setDlKey(""); }}>⬇ Download</button>
                      <button className="del-btn" onClick={() => setDelId(f.id)}>🗑 Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ ACCESS REQUESTS TAB ═══ */}
      {tab === "REQUESTS" && (
        <>
          {/* Sub tabs */}
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <button className={`sub-tab${reqTab==="INCOMING"?" active":""}`}
              onClick={() => setReqTab("INCOMING")}>
              📥 Incoming
              {pendingIncoming > 0 && (
                <span style={{ marginLeft:6, fontSize:".6rem", background:"#ef4444",
                  color:"#fff", padding:"1px 7px", borderRadius:20,
                  fontFamily:"monospace", fontWeight:800 }}>{pendingIncoming}</span>
              )}
            </button>
            <button className={`sub-tab${reqTab==="OUTGOING"?" active":""}`}
              onClick={() => setReqTab("OUTGOING")}>
              📤 Outgoing
              <span style={{ marginLeft:6, fontSize:".6rem",
                background: reqTab==="OUTGOING" ? "rgba(255,255,255,.2)" : "#f1f5f9",
                color: reqTab==="OUTGOING" ? "#fff" : "#64748b",
                padding:"1px 7px", borderRadius:20, fontFamily:"monospace", fontWeight:800 }}>
                {outgoing.length}
              </span>
            </button>
            <button onClick={fetchRequests} style={{ marginLeft:"auto", padding:"6px 14px",
              borderRadius:8, border:"1.5px solid #e2e8f0", background:"#fff", color:"#64748b",
              cursor:"pointer", fontWeight:700, fontSize:".78rem", fontFamily:"'Outfit',sans-serif" }}>
              ↻ Refresh
            </button>
          </div>

          {reqLoad ? (
            <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
              <div style={{ width:36, height:36, border:"3px solid #e2e8f0",
                borderTopColor:"#059669", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
            </div>
          ) : reqTab === "INCOMING" ? (
            /* ── INCOMING ── */
            incoming.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:16, padding:"60px 0",
                textAlign:"center", boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                <div style={{ fontSize:".88rem", color:"#94a3b8" }}>No incoming access requests yet.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:".75rem", color:"#64748b", marginBottom:4 }}>
                  People who want to download your files — review and decide.
                </div>
                {incoming.map((r, i) => {
                  const ss = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING;
                  const isPending = r.status === "PENDING";
                  return (
                    <div key={r.requestId} className="req-card"
                      style={{ "--rc": isPending ? "#f97316" : ss.color, animationDelay:`${i*30}ms` }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{ width:38, height:38, borderRadius:10, flexShrink:0,
                            background:"linear-gradient(135deg,#059669,#0891b2)",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:".85rem", fontWeight:800, color:"#fff" }}>
                            {r.requesterEmail?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:".88rem", color:"#0f172a" }}>
                              {r.requesterEmail}
                            </div>
                            <div style={{ fontSize:".75rem", color:"#64748b", marginTop:2 }}>
                              Requesting access to{" "}
                              <strong style={{ color:"#0f172a" }}>"{r.fileName}"</strong>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                            padding:"3px 10px", borderRadius:20,
                            color:ss.color, background:ss.bg, border:`1px solid ${ss.border}` }}>
                            {ss.label}
                          </span>
                          {isPending && (
                            <>
                              <button className="approve-btn"
                                disabled={actId === r.requestId}
                                onClick={() => approveRequest(r.requestId)}>
                                {actId === r.requestId ? "..." : "✓ Approve"}
                              </button>
                              <button className="reject-btn"
                                disabled={actId === r.requestId}
                                onClick={() => rejectRequest(r.requestId)}>
                                {actId === r.requestId ? "..." : "✕ Reject"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ── OUTGOING ── */
            outgoing.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:16, padding:"60px 0",
                textAlign:"center", boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📤</div>
                <div style={{ fontSize:".88rem", color:"#94a3b8" }}>
                  You haven't requested access to any files yet.
                </div>
                <div style={{ fontSize:".78rem", color:"#94a3b8", marginTop:6 }}>
                  Go to "All Files" to browse and request access.
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ fontSize:".75rem", color:"#64748b", marginBottom:4 }}>
                  Files you've requested access to — waiting for owner approval.
                </div>
                {outgoing.map((r, i) => {
                  const ss = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING;
                  return (
                    <div key={r.requestId} className="req-card"
                      style={{ "--rc": ss.color, animationDelay:`${i*30}ms` }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:".88rem", color:"#0f172a", marginBottom:3 }}>
                            "{r.fileName}"
                          </div>
                          <div style={{ fontSize:".75rem", color:"#64748b" }}>
                            Owner: <strong style={{ color:"#0f172a" }}>{r.ownerEmail}</strong>
                          </div>
                        </div>
                        <span style={{ fontSize:".62rem", fontFamily:"monospace", fontWeight:800,
                          padding:"4px 12px", borderRadius:20,
                          color:ss.color, background:ss.bg, border:`1px solid ${ss.border}` }}>
                          {ss.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}