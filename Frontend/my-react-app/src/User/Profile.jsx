import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/user";

export default function Profile() {
  const token   = sessionStorage.getItem("token");
  const email   = sessionStorage.getItem("email") || "";
  const headers = { Authorization: `Bearer ${token}` };

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editName, setEditName] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const [pwForm,   setPwForm]   = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [showPw,   setShowPw]   = useState({ cur:false, nw:false, cn:false });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/profile`, { headers });
      setProfile(res.data); setEditName(res.data.name || "");
    } catch (e) { showToast("Failed to load profile", "error"); }
    finally { setLoading(false); }
  };

  const updateName = async () => {
    if (!editName.trim()) { showToast("Name cannot be empty", "error"); return; }
    setSaving(true);
    try {
      await axios.put(`${API}/profile/update`, { name: editName }, { headers });
      setProfile(p => ({ ...p, name: editName }));
      sessionStorage.setItem("name", editName);
      showToast("Name updated successfully!", "success");
    } catch (e) { showToast(e.response?.data?.error || "Update failed", "error"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword) { showToast("Enter your current password", "error"); return; }
    if (newPassword.length < 6) { showToast("New password must be at least 6 characters", "error"); return; }
    if (newPassword !== confirmPassword) { showToast("New passwords do not match", "error"); return; }
    setPwSaving(true);
    try {
      await axios.put(`${API}/profile/password`, { currentPassword, newPassword }, { headers });
      showToast("Password changed successfully!", "success");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (e) { showToast(e.response?.data?.error || "Password change failed", "error"); }
    finally { setPwSaving(false); }
  };

  const showToast = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; }
    .inp { width:100%; padding:11px 16px; border-radius:10px; border:1.5px solid #e2e8f0;
      background:#fff; font-family:'Outfit',sans-serif; font-size:.87rem; color:#0f172a;
      outline:none; transition:border .2s; }
    .inp:focus { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,.08); }
    .save-btn { padding:10px 24px; border-radius:9px; border:none; cursor:pointer;
      background:linear-gradient(135deg,#059669,#0891b2); color:#fff;
      font-family:'Outfit',sans-serif; font-size:.85rem; font-weight:700;
      transition:all .25s; }
    .save-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 22px rgba(5,150,105,.3); }
    .save-btn:disabled { opacity:.6; cursor:not-allowed; }
    .sec-head { font-size:.65rem; font-weight:800; letter-spacing:2px; text-transform:uppercase;
      color:#94a3b8; font-family:'Outfit',sans-serif; margin-bottom:16px;
      padding-bottom:10px; border-bottom:1px solid #f1f5f9; }
    .lbl { display:block; font-size:.75rem; font-weight:700; color:#374151;
      text-transform:uppercase; letter-spacing:1.2px; margin-bottom:7px; }
    .toast { position:fixed; bottom:28px; right:28px; z-index:9999;
      padding:12px 20px; border-radius:10px; font-size:.84rem; font-weight:600;
      animation:slideIn .3s ease; font-family:'Outfit',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,.12); }
    .toast.success { background:#f0fdf4; border:1.5px solid #6ee7b7; color:#059669; }
    .toast.error   { background:#fef2f2; border:1.5px solid #fecaca; color:#ef4444; }
  `;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", flexDirection:"column", gap:14, background:"#f0f4ff" }}>
      <style>{CSS}</style>
      <div style={{ width:40, height:40, border:"3px solid #e2e8f0",
        borderTopColor:"#059669", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ padding:"88px 5% 60px", background:"#f0f4ff", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div style={{ maxWidth:720, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:".65rem", color:"#94a3b8", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>User · Profile</div>
          <div className="bh" style={{ fontSize:"2.2rem", color:"#0f172a" }}>My Profile</div>
        </div>

        {/* Profile card */}
        <div style={{ background:"#fff", borderRadius:18, padding:"28px",
          boxShadow:"0 1px 12px rgba(0,0,0,.06)", marginBottom:16 }}>

          {/* Avatar + info */}
          <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:28,
            paddingBottom:22, borderBottom:"1px solid #f1f5f9" }}>
            <div style={{ width:72, height:72, borderRadius:18, flexShrink:0,
              background:"linear-gradient(135deg,#059669,#0891b2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.8rem", fontWeight:800, color:"#fff",
              boxShadow:"0 8px 24px rgba(5,150,105,.3)" }}>
              {profile?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div style={{ flex:1 }}>
              <div className="bh" style={{ fontSize:"1.6rem", color:"#0f172a", marginBottom:3 }}>{profile?.name}</div>
              <div style={{ fontSize:".83rem", color:"#64748b", marginBottom:6 }}>{profile?.email}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                  color:"#059669", background:"#f0fdf4", border:"1px solid #6ee7b7",
                  padding:"3px 10px", borderRadius:20 }}>{profile?.role || "WEB USER"}</span>
                <span style={{ fontSize:".6rem", fontFamily:"monospace", fontWeight:800,
                  color:"#0891b2", background:"#f0f9ff", border:"1px solid #bae6fd",
                  padding:"3px 10px", borderRadius:20 }}>{profile?.fileCount || 0} FILES</span>
              </div>
            </div>
          </div>

          {/* Edit name */}
          <div className="sec-head">Edit Profile</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, marginBottom:8 }}>
            <div>
              <label className="lbl">Display Name</label>
              <input className="inp" value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Your name" />
            </div>
            <div style={{ display:"flex", alignItems:"flex-end" }}>
              <button className="save-btn" onClick={updateName} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          <div>
            <label className="lbl" style={{ marginTop:14 }}>Email Address</label>
            <input className="inp" value={profile?.email || ""} disabled
              style={{ background:"#f8faff", color:"#94a3b8", cursor:"not-allowed" }} />
            <p style={{ fontSize:".72rem", color:"#94a3b8", marginTop:5 }}>Email cannot be changed.</p>
          </div>
        </div>

        {/* Change password */}
        <div style={{ background:"#fff", borderRadius:18, padding:"28px",
          boxShadow:"0 1px 12px rgba(0,0,0,.06)" }}>
          <div className="sec-head">Change Password</div>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[
              { key:"currentPassword", label:"Current Password",  show:"cur" },
              { key:"newPassword",     label:"New Password",      show:"nw" },
              { key:"confirmPassword", label:"Confirm New Password", show:"cn" },
            ].map(f => (
              <div key={f.key}>
                <label className="lbl">{f.label}</label>
                <div style={{ position:"relative" }}>
                  <input className="inp" type={showPw[f.show] ? "text" : "password"}
                    value={pwForm[f.key]}
                    onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={`Enter ${f.label.toLowerCase()}`} />
                  <button onClick={() => setShowPw(p => ({ ...p, [f.show]: !p[f.show] }))} style={{
                    position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                    background:"none", border:"none", cursor:"pointer", fontSize:15, color:"#94a3b8"
                  }}>{showPw[f.show] ? "🙈" : "👁️"}</button>
                </div>
              </div>
            ))}

            {/* Password strength */}
            {pwForm.newPassword && (
              <div>
                <div style={{ display:"flex", gap:4 }}>
                  {[1,2,3,4].map(n => {
                    const len = pwForm.newPassword.length;
                    const active = (n===1&&len>=1)||(n===2&&len>=6)||(n===3&&len>=10&&/[A-Z]/.test(pwForm.newPassword))||(n===4&&len>=10&&/[A-Z]/.test(pwForm.newPassword)&&/[0-9]/.test(pwForm.newPassword));
                    const colors = ["#ef4444","#f97316","#eab308","#059669"];
                    return <div key={n} style={{ flex:1, height:3, borderRadius:2,
                      background: active ? colors[n-1] : "#e2e8f0', transition:'background .3s'" }} />;
                  })}
                </div>
                <div style={{ fontSize:".7rem", color:"#94a3b8", marginTop:4 }}>
                  Min 6 chars · Uppercase · Numbers for strong password
                </div>
              </div>
            )}

            <button className="save-btn" onClick={changePassword} disabled={pwSaving}
              style={{ alignSelf:"flex-start" }}>
              {pwSaving ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}