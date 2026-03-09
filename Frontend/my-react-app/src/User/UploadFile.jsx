import { useState, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/user";

export default function UploadFile() {
  const token   = sessionStorage.getItem("token");
  const email   = sessionStorage.getItem("email") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const [file,      setFile]      = useState(null);
  const [secretKey, setSecretKey] = useState("");
  const [showKey,   setShowKey]   = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast,     setToast]     = useState(null);
  const [progress,  setProgress]  = useState(0);
  const inputRef = useRef();

  const ALLOWED = ["jpg","jpeg","png","pdf","docx","txt"];
  const MAX_MB  = 10;

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) { showToast(`File type .${ext} not allowed. Use: ${ALLOWED.join(", ")}`, "error"); return; }
    if (f.size > MAX_MB * 1024 * 1024) { showToast(`File too large. Max ${MAX_MB}MB allowed.`, "error"); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file)      { showToast("Please select a file.", "error"); return; }
    if (!secretKey) { showToast("Please enter your secret encryption key.", "error"); return; }

    setUploading(true); setProgress(0);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("secretKey", secretKey);

    try {
      await axios.post(`${API}/upload`, fd, {
        headers,
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      showToast("File uploaded and encrypted successfully!", "success");
      setFile(null); setSecretKey(""); setProgress(0);
    } catch (e) {
      showToast(e.response?.data || "Upload failed. Please try again.", "error");
    } finally { setUploading(false); }
  };

  const ext = file?.name.split(".").pop()?.toUpperCase() || "";
  const EXT_COLORS = { PDF:"#ef4444",JPG:"#2563eb",JPEG:"#2563eb",PNG:"#059669",DOCX:"#7c3aed",TXT:"#f97316" };
  const ec = EXT_COLORS[ext] || "#64748b";

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }

    .drop-zone {
      border:2px dashed #e2e8f0; border-radius:16px; padding:48px 24px;
      text-align:center; cursor:pointer; transition:all .25s;
      background:#fafbff;
    }
    .drop-zone:hover, .drop-zone.drag { border-color:#059669; background:#f0fdf4; }
    .drop-zone.has-file { border-color:#059669; border-style:solid; background:#f0fdf4; }

    .inp {
      width:100%; padding:11px 16px; border-radius:10px;
      border:1.5px solid #e2e8f0; background:#fff;
      font-family:'Outfit',sans-serif; font-size:.87rem; color:#0f172a;
      outline:none; transition:border .2s;
    }
    .inp:focus { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,.08); }

    .upload-btn {
      width:100%; padding:14px; border-radius:11px; border:none;
      background:linear-gradient(135deg,#059669,#0891b2);
      color:#fff; font-family:'Outfit',sans-serif;
      font-size:.95rem; font-weight:700; cursor:pointer;
      transition:all .25s; letter-spacing:.3px;
    }
    .upload-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(5,150,105,.35); }
    .upload-btn:disabled { opacity:.6; cursor:not-allowed; }

    .toast { position:fixed; bottom:28px; right:28px; z-index:9999;
      padding:12px 20px; border-radius:10px; font-size:.84rem; font-weight:600;
      animation:slideIn .3s ease; font-family:'Outfit',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.12); max-width:360px; }
    .toast.success { background:#f0fdf4; border:1.5px solid #6ee7b7; color:#059669; }
    .toast.error   { background:#fef2f2; border:1.5px solid #fecaca; color:#ef4444; }
  `;

  return (
    <div style={{ padding:"88px 5% 60px", background:"#f0f4ff", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div style={{ maxWidth:640, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>User · Upload</div>
          <div className="bh" style={{ fontSize:"2.2rem", color:"#0f172a" }}>Upload File</div>
          <p style={{ fontSize:".85rem", color:"#64748b", marginTop:4 }}>
            Your file will be AES-256 encrypted before uploading to AWS S3.
          </p>
        </div>

        <div style={{ background:"#fff", borderRadius:18, padding:"28px",
          boxShadow:"0 1px 12px rgba(0,0,0,.06)" }}>

          {/* Drop zone */}
          <div style={{ marginBottom:22 }}>
            <label style={{ display:"block", fontSize:".75rem", fontWeight:700, color:"#374151",
              textTransform:"uppercase", letterSpacing:1.2, marginBottom:8 }}>Select File</label>
            <div
              className={`drop-zone${dragging?" drag":""}${file?" has-file":""}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}>
              <input ref={inputRef} type="file" style={{ display:"none" }}
                accept=".jpg,.jpeg,.png,.pdf,.docx,.txt"
                onChange={e => handleFile(e.target.files[0])} />
              {file ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:8 }}>
                    <span style={{ fontSize:".65rem", fontFamily:"monospace", fontWeight:800,
                      color:ec, background:`${ec}12`, border:`1px solid ${ec}28`,
                      padding:"3px 10px", borderRadius:6 }}>{ext}</span>
                    <span style={{ fontWeight:700, fontSize:".95rem", color:"#0f172a" }}>{file.name}</span>
                  </div>
                  <div style={{ fontSize:".78rem", color:"#64748b" }}>
                    {(file.size/1024).toFixed(1)} KB · Click to change
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:40, marginBottom:12 }}>📤</div>
                  <div style={{ fontWeight:700, fontSize:".95rem", color:"#374151", marginBottom:6 }}>
                    Drop file here or click to browse
                  </div>
                  <div style={{ fontSize:".78rem", color:"#94a3b8" }}>
                    Allowed: JPG, PNG, PDF, DOCX, TXT · Max 10MB
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secret key */}
          <div style={{ marginBottom:22 }}>
            <label style={{ display:"block", fontSize:".75rem", fontWeight:700, color:"#374151",
              textTransform:"uppercase", letterSpacing:1.2, marginBottom:8 }}>
              Encryption Secret Key
            </label>
            <div style={{ position:"relative" }}>
              <input className="inp" type={showKey ? "text" : "password"}
                placeholder="Enter your secret key for AES-256 encryption"
                value={secretKey} onChange={e => setSecretKey(e.target.value)} />
              <button onClick={() => setShowKey(p => !p)} style={{
                position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer",
                fontSize:16, color:"#94a3b8"
              }}>{showKey ? "🙈" : "👁️"}</button>
            </div>
            <p style={{ fontSize:".72rem", color:"#94a3b8", marginTop:6 }}>
              ⚠️ Remember this key — it's required to decrypt and download your file.
            </p>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:".75rem", fontWeight:700, color:"#059669" }}>Uploading & Encrypting...</span>
                <span style={{ fontSize:".75rem", fontFamily:"monospace", color:"#059669" }}>{progress}%</span>
              </div>
              <div style={{ height:6, background:"#e2e8f0", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:3, width:`${progress}%`,
                  background:"linear-gradient(90deg,#059669,#0891b2)", transition:"width .3s" }} />
              </div>
            </div>
          )}

          {/* Upload button */}
          <button className="upload-btn" onClick={handleUpload} disabled={uploading || !file || !secretKey}>
            {uploading
              ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                  <span style={{ width:18, height:18, border:"2px solid rgba(255,255,255,.3)",
                    borderTopColor:"#fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                  Encrypting & Uploading...
                </span>
              : "🔐  Encrypt & Upload to S3"}
          </button>

          {/* Info strip */}
          <div style={{ marginTop:20, padding:"14px 16px", borderRadius:10,
            background:"linear-gradient(135deg,#f0fdf4,#eff6ff)",
            border:"1px solid #e2e8f0" }}>
            <div style={{ fontSize:".72rem", fontWeight:700, color:"#374151", marginBottom:8 }}>
              How it works
            </div>
            {["Your secret key → SHA-256 hash → AES-256/ECB cipher key",
              "File encrypted client-side before reaching AWS S3",
              "Only you (with your key) can decrypt and download"].map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ width:16, height:16, borderRadius:"50%", background:"#dcfce7",
                  border:"1px solid #6ee7b7", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:".6rem", color:"#059669",
                  fontWeight:800, flexShrink:0 }}>✓</span>
                <span style={{ fontSize:".75rem", color:"#475569" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}