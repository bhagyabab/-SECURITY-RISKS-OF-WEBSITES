import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8080/api/manager";

export default function ManagerProfile() {
  const token   = sessionStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  // edit name
  const [editMode, setEditMode] = useState(false);
  const [newName,  setNewName]  = useState("");
  const [saving,   setSaving]   = useState(false);

  // password
  const [pwMode,   setPwMode]   = useState(false);
  const [pwForm,   setPwForm]   = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw,   setShowPw]   = useState({ cur:false, nw:false, cf:false });

  const [toast, setToast] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/profile`, { headers });
      setProfile(res.data);
      setNewName(res.data.name || "");
    } catch (e) {
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    if (!newName.trim()) return showToast("Name cannot be empty!", "error");
    setSaving(true);
    try {
      const res = await axios.put(`${API}/profile/update`, { name: newName }, { headers });
      setProfile(p => ({ ...p, name: res.data.name }));
      sessionStorage.setItem("name", res.data.name);
      setEditMode(false);
      showToast("Name updated successfully!", "success");
    } catch (e) {
      showToast(e.response?.data?.error || "Failed to update name", "error");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = pwForm;
    if (!currentPassword) return showToast("Current password is required!", "error");
    if (newPassword.length < 6) return showToast("New password must be at least 6 characters!", "error");
    if (newPassword !== confirmPassword) return showToast("Passwords do not match!", "error");

    setPwSaving(true);
    try {
      await axios.put(`${API}/profile/password`, { currentPassword, newPassword }, { headers });
      setPwMode(false);
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
      showToast("Password changed successfully!", "success");
    } catch (e) {
      showToast(e.response?.data?.error || "Failed to change password", "error");
    } finally {
      setPwSaving(false);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const pwStrength = (pw) => {
    if (!pw) return { label:"", color:"#e5e7eb", w:"0%" };
    let score = 0;
    if (pw.length >= 8)              score++;
    if (/[A-Z]/.test(pw))           score++;
    if (/[0-9]/.test(pw))           score++;
    if (/[^A-Za-z0-9]/.test(pw))    score++;
    const map = [
      { label:"Weak",   color:"#ef4444", w:"25%" },
      { label:"Fair",   color:"#f97316", w:"50%" },
      { label:"Good",   color:"#eab308", w:"75%" },
      { label:"Strong", color:"#22c55e", w:"100%" },
    ];
    return map[score - 1] || map[0];
  };

  const strength = pwStrength(pwForm.newPassword);

  const statusBadge = (s) => {
    const map = {
      APPROVED: { bg:"#d1fae5", color:"#059669", label:"✓ APPROVED" },
      PENDING:  { bg:"#fef3c7", color:"#d97706", label:"⏳ PENDING" },
      REJECTED: { bg:"#fee2e2", color:"#ef4444", label:"✕ REJECTED" },
    };
    const st = map[s] || map["PENDING"];
    return (
      <span style={{
        background: st.bg, color: st.color,
        fontSize: 11, fontWeight: 700, letterSpacing: 1,
        padding: "3px 10px", borderRadius: 20, display:"inline-block"
      }}>{st.label}</span>
    );
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Outfit',sans-serif; }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; line-height:1.05; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    .card {
      background:#fff; border-radius:16px;
      box-shadow:0 1px 16px rgba(0,0,0,.07);
      padding:28px 28px 24px;
      animation: fadeUp .5s ease both;
    }
    .inp {
      width:100%; padding:10px 14px; border-radius:10px;
      border:1.5px solid #e5e7eb; font-size:15px;
      font-family:'Outfit',sans-serif; outline:none;
      transition:border .2s;
    }
    .inp:focus { border-color:#d97706; }
    .inp:disabled { background:#f9fafb; color:#9ca3af; cursor:not-allowed; }
    .btn {
      padding:10px 22px; border-radius:10px; border:none;
      font-size:14px; font-weight:600; cursor:pointer;
      font-family:'Outfit',sans-serif; transition:all .2s;
    }
    .btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.15); }
    .btn:disabled { opacity:.6; cursor:not-allowed; }
    .btn-amber { background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; }
    .btn-ghost { background:#f3f4f6; color:#374151; }
    .btn-red   { background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; }
    .pw-toggle {
      position:absolute; right:12px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer; color:#9ca3af; font-size:16px;
    }
  `;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <div style={{ width:40, height:40, border:"4px solid #fde68a", borderTopColor:"#d97706",
        borderRadius:"50%", animation:"spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#fff9f0", padding:"32px 24px" }}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:24, right:24, zIndex:9999,
          background: toast.type === "success" ? "#059669" : "#ef4444",
          color:"#fff", padding:"12px 22px", borderRadius:12,
          fontWeight:600, fontSize:14, boxShadow:"0 8px 24px rgba(0,0,0,.15)",
          animation:"fadeUp .3s ease"
        }}>{toast.msg}</div>
      )}

      <div style={{ maxWidth:680, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom:28, animation:"fadeUp .4s ease" }}>
          <div className="bh" style={{ fontSize:32, color:"#92400e" }}>MY PROFILE</div>
          <div style={{ color:"#78716c", fontSize:14, marginTop:4 }}>Manage your account details and password</div>
        </div>

        {/* Avatar card */}
        <div className="card" style={{ marginBottom:20, animationDelay:"0ms",
          display:"flex", alignItems:"center", gap:20,
          borderTop:"3px solid #d97706" }}>
          <div style={{
            width:72, height:72, borderRadius:"50%", flexShrink:0,
            background:"linear-gradient(135deg,#f59e0b,#d97706)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, fontWeight:800, color:"#fff",
            boxShadow:"0 4px 16px rgba(217,119,6,.35)"
          }}>
            {profile?.name?.charAt(0)?.toUpperCase() || "M"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:700, color:"#1c1917" }}>{profile?.name}</div>
            <div style={{ fontSize:13, color:"#78716c", marginTop:2 }}>{profile?.email}</div>
            <div style={{ marginTop:6 }}>{statusBadge(profile?.approvalStatus)}</div>
          </div>
          <div style={{
            background:"#fff7ed", border:"1.5px solid #fed7aa",
            borderRadius:10, padding:"8px 16px", textAlign:"center"
          }}>
            <div className="bh" style={{ fontSize:22, color:"#d97706" }}>🗂️</div>
            <div style={{ fontSize:11, color:"#78716c", fontWeight:600 }}>MANAGER</div>
          </div>
        </div>

        {/* Edit Name card */}
        <div className="card" style={{ marginBottom:20, animationDelay:"80ms", borderTop:"3px solid #f59e0b" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:"#1c1917" }}>Display Name</div>
              <div style={{ fontSize:13, color:"#78716c", marginTop:2 }}>Update how your name appears in the system</div>
            </div>
            {!editMode && (
              <button className="btn btn-amber" onClick={() => { setEditMode(true); setNewName(profile?.name || ""); }}>
                ✎ Edit
              </button>
            )}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <input
              className="inp"
              value={editMode ? newName : profile?.name || ""}
              onChange={e => setNewName(e.target.value)}
              disabled={!editMode}
              placeholder="Your display name"
            />
            {editMode && (
              <>
                <button className="btn btn-amber" onClick={saveName} disabled={saving} style={{ whiteSpace:"nowrap" }}>
                  {saving ? "Saving…" : "Save"}
                </button>
                <button className="btn btn-ghost" onClick={() => setEditMode(false)} style={{ whiteSpace:"nowrap" }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Email card (read-only) */}
        <div className="card" style={{ marginBottom:20, animationDelay:"120ms", borderTop:"3px solid #e5e7eb" }}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:16, color:"#1c1917" }}>Email Address</div>
            <div style={{ fontSize:13, color:"#78716c", marginTop:2 }}>Your login email — cannot be changed</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <input className="inp" value={profile?.email || ""} disabled />
            <span style={{
              background:"#f3f4f6", color:"#6b7280", fontSize:12,
              padding:"6px 12px", borderRadius:8, whiteSpace:"nowrap", fontWeight:600
            }}>🔒 LOCKED</span>
          </div>
        </div>

        {/* Change Password card */}
        <div className="card" style={{ animationDelay:"160ms", borderTop:"3px solid #d97706" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: pwMode ? 20 : 0 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:"#1c1917" }}>Password</div>
              <div style={{ fontSize:13, color:"#78716c", marginTop:2 }}>Keep your account secure with a strong password</div>
            </div>
            {!pwMode && (
              <button className="btn btn-amber" onClick={() => setPwMode(true)}>
                🔑 Change
              </button>
            )}
          </div>

          {pwMode && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* Current password */}
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
                  Current Password
                </label>
                <div style={{ position:"relative" }}>
                  <input
                    className="inp"
                    type={showPw.cur ? "text" : "password"}
                    placeholder="Enter current password"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    style={{ paddingRight:40 }}
                  />
                  <button className="pw-toggle" onClick={() => setShowPw(p => ({ ...p, cur:!p.cur }))}>
                    {showPw.cur ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
                  New Password
                </label>
                <div style={{ position:"relative" }}>
                  <input
                    className="inp"
                    type={showPw.nw ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    style={{ paddingRight:40 }}
                  />
                  <button className="pw-toggle" onClick={() => setShowPw(p => ({ ...p, nw:!p.nw }))}>
                    {showPw.nw ? "🙈" : "👁️"}
                  </button>
                </div>
                {pwForm.newPassword && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ height:5, background:"#e5e7eb", borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:strength.w, background:strength.color,
                        borderRadius:4, transition:"all .3s" }} />
                    </div>
                    <div style={{ fontSize:12, color:strength.color, fontWeight:600, marginTop:4 }}>
                      {strength.label}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>
                  Confirm New Password
                </label>
                <div style={{ position:"relative" }}>
                  <input
                    className="inp"
                    type={showPw.cf ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    style={{ paddingRight:40,
                      borderColor: pwForm.confirmPassword
                        ? pwForm.confirmPassword === pwForm.newPassword ? "#22c55e" : "#ef4444"
                        : undefined
                    }}
                  />
                  <button className="pw-toggle" onClick={() => setShowPw(p => ({ ...p, cf:!p.cf }))}>
                    {showPw.cf ? "🙈" : "👁️"}
                  </button>
                </div>
                {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                  <div style={{ fontSize:12, color:"#ef4444", marginTop:4 }}>⚠ Passwords do not match</div>
                )}
              </div>

              <div style={{ display:"flex", gap:10, marginTop:4 }}>
                <button className="btn btn-amber" onClick={savePassword} disabled={pwSaving}>
                  {pwSaving ? "Saving…" : "🔑 Update Password"}
                </button>
                <button className="btn btn-ghost" onClick={() => {
                  setPwMode(false);
                  setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}