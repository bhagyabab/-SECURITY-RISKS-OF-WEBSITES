import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/admin";

export default function FileManagement() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [files,   setFiles]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [delId,   setDelId]   = useState(null);
  const [toast,   setToast]   = useState(null);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/files`, { headers });
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (e) { showToast("Failed to load files", "error"); }
    finally { setLoading(false); }
  };

  const deleteFile = async (id) => {
    try {
      await axios.delete(`${API}/file/${id}`, { headers });
      setFiles(f => f.filter(x => x.id !== id));
      showToast("File deleted successfully", "success");
    } catch (e) { showToast("Failed to delete file", "error"); }
    finally { setDelId(null); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const EXT_COLORS = { PDF:"#ef4444", JPG:"#2563eb", JPEG:"#2563eb", PNG:"#059669", DOCX:"#7c3aed", TXT:"#f97316" };
  const getExt = f => f.fileName?.split(".").pop()?.toUpperCase() || "?";
  const getColor = f => EXT_COLORS[getExt(f)] || "#64748b";

  const allTypes = ["ALL", ...new Set(files.map(getExt))];
  const filtered = files.filter(f => {
    const matchSearch = f.fileName?.toLowerCase().includes(search.toLowerCase()) ||
                        f.email?.toLowerCase().includes(search.toLowerCase());
    const matchType = filter === "ALL" || getExt(f) === filter;
    return matchSearch && matchType;
  });

  const totalSize = files.reduce((a, f) => a + (f.fileSize || 0), 0);
  const sizeDisplay = totalSize >= 1024*1024
    ? (totalSize/(1024*1024)).toFixed(2)+" MB"
    : (totalSize/1024).toFixed(1)+" KB";

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .search-input {
      width:100%; padding:10px 16px 10px 40px; border-radius:10px;
      border:1.5px solid #e2e8f0; background:#fff;
      font-family:'Outfit',sans-serif; font-size:.87rem; color:#0f172a;
      outline:none; transition:border .2s;
    }
    .search-input:focus { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,.08); }

    .filter-chip {
      padding:6px 14px; border-radius:20px; cursor:pointer;
      font-size:.72rem; font-weight:700; font-family:'Outfit',sans-serif;
      border:1.5px solid #e2e8f0; background:#fff; color:#64748b;
      transition:all .2s; white-space:nowrap;
    }
    .filter-chip.active {
      background:#059669; color:#fff; border-color:#059669;
      box-shadow:0 3px 10px rgba(5,150,105,.25);
    }
    .filter-chip:hover:not(.active) { border-color:#059669; color:#059669; }

    .file-row {
      display:grid; grid-template-columns:36px 1fr 160px 80px 80px 90px;
      align-items:center; gap:12px; padding:12px 16px; border-radius:12px;
      transition:background .15s; animation:fadeUp .4s ease both;
    }
    .file-row:hover { background:#f8faff; }

    .del-btn {
      padding:5px 12px; border-radius:7px; cursor:pointer;
      font-size:.72rem; font-weight:700; border:1.5px solid #fecaca;
      background:#fef2f2; color:#ef4444; font-family:'Outfit',sans-serif;
      transition:all .2s;
    }
    .del-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; }

    .confirm-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,.45);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; backdrop-filter:blur(4px);
    }
    .confirm-box {
      background:#fff; border-radius:18px; padding:32px 28px;
      max-width:360px; width:90%; animation:slideIn .3s ease;
      box-shadow:0 24px 60px rgba(0,0,0,.18);
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

      {delId && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <div className="bh" style={{ fontSize:"1.4rem", color:"#0f172a", marginBottom:8 }}>Delete File?</div>
            <p style={{ fontSize:".87rem", color:"#64748b", lineHeight:1.75, marginBottom:24 }}>
              This will permanently delete the file from S3 and remove its metadata from the database.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDelId(null)} style={{
                flex:1, padding:"10px", borderRadius:9, border:"1.5px solid #e2e8f0",
                background:"#fff", cursor:"pointer", fontWeight:600, fontSize:".84rem",
                fontFamily:"'Outfit',sans-serif", color:"#64748b"
              }}>Cancel</button>
              <button onClick={() => deleteFile(delId)} style={{
                flex:1, padding:"10px", borderRadius:9, border:"none",
                background:"#ef4444", cursor:"pointer", fontWeight:700,
                fontSize:".84rem", fontFamily:"'Outfit',sans-serif", color:"#fff"
              }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Admin · File Management</div>
        <div className="bh" style={{ fontSize:"2.2rem", color:"#0f172a" }}>File Management</div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:12, marginBottom:22 }}>
        {[
          { label:"Total Files",  value:files.length,    c:"#059669" },
          //{ label:"Total Size",   value:sizeDisplay,     c:"#f97316" },
          { label:"File Types",   value:allTypes.length-1, c:"#7c3aed" },
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

        {/* Search + filter chips */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:13, top:"50%",
                transform:"translateY(-50%)", fontSize:15, color:"#94a3b8" }}>🔍</span>
              <input className="search-input" placeholder="Search by file name or uploader..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={fetchFiles} style={{
              padding:"9px 18px", borderRadius:9, border:"1.5px solid #6ee7b7",
              background:"#f0fdf4", color:"#059669", cursor:"pointer",
              fontWeight:700, fontSize:".8rem", fontFamily:"'Outfit',sans-serif"
            }}>↻ Refresh</button>
          </div>
          {/* Type filter chips */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {allTypes.map(t => (
              <button key={t} className={`filter-chip${filter===t?" active":""}`}
                onClick={() => setFilter(t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div style={{ display:"grid", gridTemplateColumns:"36px 1fr 160px 80px 80px 90px",
          gap:12, padding:"8px 16px", borderBottom:"2px solid #f1f5f9", marginBottom:4 }}>
          {["#","File Name","Uploaded By","Type","Size","Action"].map(h => (
            <div key={h} style={{ fontSize:".62rem", fontWeight:800, color:"#94a3b8",
              letterSpacing:1.5, fontFamily:"monospace", textTransform:"uppercase" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
            <div style={{ width:36, height:36, border:"3px solid #e2e8f0",
              borderTopColor:"#059669", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8", fontSize:".85rem" }}>
            {search || filter !== "ALL" ? "No files match your filter." : "No files found."}
          </div>
        ) : filtered.map((f, i) => {
          const ext = getExt(f);
          const ec  = getColor(f);
          return (
            <div key={f.id} className="file-row" style={{ animationDelay:`${i*35}ms` }}>
              <div style={{ fontFamily:"monospace", fontSize:".75rem", color:"#cbd5e1" }}>
                {String(i+1).padStart(2,"0")}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:9, minWidth:0 }}>
                <span style={{ fontSize:".56rem", fontFamily:"monospace", fontWeight:800,
                  color:ec, background:`${ec}10`, border:`1px solid ${ec}28`,
                  padding:"2px 7px", borderRadius:5, flexShrink:0 }}>{ext}</span>
                <span style={{ fontWeight:600, fontSize:".86rem", color:"#0f172a",
                  whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.fileName}</span>
              </div>
              <div style={{ fontSize:".82rem", color:"#64748b",
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.email}</div>
              <div>
                <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:700,
                  color:"#7c3aed", background:"#f5f3ff", border:"1px solid #ddd6fe",
                  padding:"2px 8px", borderRadius:20 }}>{f.fileType || ext}</span>
              </div>
              <div style={{ fontFamily:"monospace", fontSize:".78rem", color:"#64748b" }}>
                {f.fileSize ? (f.fileSize/1024).toFixed(1)+" KB" : "—"}
              </div>
              <div>
                <button className="del-btn" onClick={() => setDelId(f.id)}>Delete</button>
              </div>
            </div>
          );
        })}

        {!loading && (
          <div style={{ marginTop:16, paddingTop:12, borderTop:"1px solid #f1f5f9",
            fontSize:".72rem", color:"#94a3b8", fontFamily:"monospace" }}>
            Showing {filtered.length} of {files.length} files
          </div>
        )}
      </div>
    </div>
  );
}