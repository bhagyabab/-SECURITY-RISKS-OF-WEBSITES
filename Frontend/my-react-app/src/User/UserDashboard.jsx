import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8080/api/user";

function useReveal() {
  const ref = useRef(null); const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } }, { threshold:.06 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return [ref, on];
}
const Slide = ({ children, from="bottom", delay=0 }) => {
  const [ref, on] = useReveal();
  const tx = from==="left"?"-40px":from==="right"?"40px":"0"; const ty = from==="bottom"?"32px":"0";
  return <div ref={ref} style={{ transform:on?"translate(0,0)":`translate(${tx},${ty})`, opacity:on?1:0, transition:`transform .6s cubic-bezier(.22,1,.36,1) ${delay}ms,opacity .5s ease ${delay}ms` }}>{children}</div>;
};

export default function UserDashboard() {
  const nav      = useNavigate();
  const userName = sessionStorage.getItem("name")  || "User";
  const token    = sessionStorage.getItem("token");
  const headers  = { Authorization: `Bearer ${token}` };

  const [files,    setFiles]    = useState([]);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [time,     setTime]     = useState(new Date());
  const [pending,  setPending]  = useState(0); // incoming access requests count

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fRes, pRes, rRes] = await Promise.all([
        axios.get(`${API}/files`,                     { headers }),
        axios.get(`${API}/profile`,                   { headers }),
        axios.get(`${API}/access-requests/incoming`,  { headers }),
      ]);
      setFiles(Array.isArray(fRes.data) ? fRes.data : []);
      setProfile(pRes.data);
      const inc = Array.isArray(rRes.data) ? rRes.data : [];
      setPending(inc.filter(r => r.status === "PENDING").length);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const totalSize   = files.reduce((a, f) => a + (f.fileSize || 0), 0);
  const sizeDisplay = totalSize >= 1024*1024 ? (totalSize/(1024*1024)).toFixed(2)+" MB" : (totalSize/1024).toFixed(1)+" KB";
  const EXT_COLORS  = { PDF:"#ef4444",JPG:"#2563eb",JPEG:"#2563eb",PNG:"#059669",DOCX:"#7c3aed",TXT:"#f97316" };
  const getExt      = f => f.fileName?.split(".").pop()?.toUpperCase() || "?";
  const getColor    = f => EXT_COLORS[getExt(f)] || "#64748b";

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    @keyframes spin   { to{transform:rotate(360deg)} }
    @keyframes heroIn { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
    .bh { font-family:'Bebas Neue',sans-serif; letter-spacing:2px; line-height:1.05; }
    .stat-card { background:#fff; border-top:3px solid var(--sc); border-radius:14px;
      padding:22px 20px 18px; box-shadow:0 1px 12px rgba(0,0,0,.05); transition:all .28s; }
    .stat-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.1); }
    .sec-head { font-size:.65rem; font-weight:800; letter-spacing:2px; text-transform:uppercase;
      color:#94a3b8; font-family:'Outfit',sans-serif; margin-bottom:16px;
      padding-bottom:10px; border-bottom:1px solid #f1f5f9; }
    .arow { display:flex; align-items:center; gap:12px; padding:9px 10px; border-radius:10px; transition:background .16s; }
    .arow:hover { background:#f8faff; }
    .trow { transition:background .15s; }
    .trow:hover { background:#f8faff; }
    .qcard { background:#fff; border-radius:14px; padding:18px 20px; border:1.5px solid #f1f5f9;
      cursor:pointer; transition:all .25s; display:flex; align-items:center; gap:14px;
      box-shadow:0 1px 8px rgba(0,0,0,.04); position:relative; }
    .qcard:hover { border-color:var(--qc); transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,.08); }
  `;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"100vh", flexDirection:"column", gap:14, background:"#f0f4ff" }}>
      <style>{CSS}</style>
      <div style={{ width:40, height:40, border:"3px solid #e2e8f0",
        borderTopColor:"#059669", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      <p style={{ color:"#94a3b8", fontFamily:"monospace", fontSize:".78rem", letterSpacing:1 }}>LOADING...</p>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      {/* HERO */}
      <div style={{ position:"relative", minHeight:"100vh", display:"flex",
        flexDirection:"column", justifyContent:"flex-end", overflow:"hidden" }}>
        <img src="https://www.qrtd.qa/wp-content/uploads/2023/07/DALL%C2%B7E-2024-07-11-16.25.35-An-evocative-picture-depicting-Top-Network-Security-Risks-and-How-to-Mitigate-Them.-The-image-should-feature-a-high-tech-environment-with-visual-ele.webp"
          alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center",
            filter:"brightness(.28) saturate(1.1)", zIndex:0 }} />
        <div style={{ position:"absolute", inset:0, zIndex:1,
          background:"linear-gradient(to bottom, rgba(4,7,26,.15) 0%, rgba(4,7,26,.55) 60%, rgba(4,7,26,.92) 100%)" }} />
        <div style={{ position:"absolute", inset:0, zIndex:1, opacity:.03,
          backgroundImage:"linear-gradient(rgba(52,211,153,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,.8) 1px,transparent 1px)",
          backgroundSize:"44px 44px" }} />

        <div style={{ position:"relative", zIndex:2, maxWidth:1200, width:"100%",
          margin:"0 auto", padding:"0 5% 90px", animation:"heroIn .85s cubic-bezier(.22,1,.36,1) both" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(5,150,105,.18)", border:"1px solid rgba(52,211,153,.35)",
            color:"#6ee7b7", padding:"6px 16px", borderRadius:50,
            fontSize:".68rem", fontWeight:700, letterSpacing:1.8, marginBottom:20 }}>
            <span style={{ width:6, height:6, background:"#4ade80", borderRadius:"50%", animation:"blink 1.5s infinite" }} />
            SECURE CLOUD STORAGE · YOUR DASHBOARD
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:40, alignItems:"flex-end" }}>
            <div>
              <h1 className="bh" style={{ fontSize:"clamp(2.4rem,5vw,4rem)", color:"#fff", marginBottom:12 }}>
                Welcome,{" "}
                <span style={{ background:"linear-gradient(90deg,#34d399,#22d3ee)",
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  {userName}
                </span>
              </h1>
              <p style={{ fontSize:".9rem", color:"rgba(255,255,255,.5)", maxWidth:480, lineHeight:1.85, marginBottom:26 }}>
                Your files are <strong style={{ color:"rgba(255,255,255,.75)" }}>AES-256 encrypted</strong> and safely stored on AWS S3. Browse all files and request access to download from others.
              </p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {[{ l:"Upload File",  p:"/user/upload",    c:"#059669" },
                  { l:"My Files",    p:"/user/files",     c:"#0891b2" },
                  { l:"All Files",   p:"/user/all-files", c:"#f97316" },
                  { l:"Profile",     p:"/user/profile",   c:"#7c3aed" }].map(b => (
                  <button key={b.p} onClick={() => nav(b.p)} style={{
                    padding:"9px 20px", borderRadius:9, cursor:"pointer",
                    fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:".82rem",
                    border:`1.5px solid ${b.c}60`, background:`${b.c}18`,
                    color:"rgba(255,255,255,.85)", transition:"all .25s"
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background=b.c;e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=`${b.c}18`;e.currentTarget.style.color="rgba(255,255,255,.85)";}}>{b.l}</button>
                ))}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div className="bh" style={{ fontSize:"2.8rem", letterSpacing:3, color:"#34d399" }}>{time.toLocaleTimeString()}</div>
              <div style={{ fontFamily:"monospace", fontSize:".6rem", color:"rgba(255,255,255,.25)", letterSpacing:1.2, marginTop:4 }}>
                {time.toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"short", day:"numeric" })}
              </div>
              <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:5, alignItems:"flex-end" }}>
                {[{ l:"MY FILES", v:files.length,  c:"#34d399" },
                  { l:"STORAGE",  v:sizeDisplay,   c:"#22d3ee" },
                  { l:"PENDING",  v:pending,        c:"#f97316" }].map(s => (
                  <div key={s.l} style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                    <span style={{ fontSize:".58rem", color:"rgba(255,255,255,.28)", fontFamily:"monospace", letterSpacing:1.5 }}>{s.l}</span>
                    <span className="bh" style={{ fontSize:"1.6rem", color:s.c, letterSpacing:2 }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ background:"#f0f4ff", padding:"0 5% 60px", marginTop:-24, position:"relative", zIndex:3 }}>

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
          {[
            { label:"My Files",        value:files.length,  sub:"Total uploaded",       c:"#059669" },
            { label:"Storage Used",    value:sizeDisplay,   sub:"AWS S3 encrypted",     c:"#0891b2" },
            { label:"Encryption",      value:"AES-256",     sub:"All files protected",  c:"#7c3aed" },
            { label:"Access Requests", value:pending,       sub:"Pending approvals",    c:"#f97316" },
          ].map((s, i) => (
            <Slide key={s.label} from="bottom" delay={i*65}>
              <div className="stat-card" style={{ "--sc":s.c }}>
                <div style={{ width:42, height:42, borderRadius:11, marginBottom:14,
                  background:`${s.c}12`, border:`1.5px solid ${s.c}25`,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                  {s.label==="My Files"?"📁":s.label==="Storage Used"?"💾":s.label==="Encryption"?"🔐":"🤝"}
                </div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"2.4rem",
                  letterSpacing:2, color:"#0f172a", lineHeight:1, marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:".76rem", fontWeight:700, color:s.c,
                  textTransform:"uppercase", letterSpacing:1.5 }}>{s.label}</div>
                <div style={{ fontSize:".72rem", color:"#94a3b8", marginTop:2 }}>{s.sub}</div>
                <div style={{ marginTop:14, height:2, borderRadius:2, background:`${s.c}40` }} />
              </div>
            </Slide>
          ))}
        </div>

        {/* Quick actions — now 4 cards */}
        <Slide from="bottom">
          <div style={{ background:"#fff", borderRadius:16, padding:"22px",
            boxShadow:"0 1px 12px rgba(0,0,0,.05)", marginBottom:16 }}>
            <div className="sec-head">Quick Actions</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {[
                { icon:"📤", label:"Upload File",   sub:"Encrypt & upload to S3",         path:"/user/upload",    c:"#059669" },
                { icon:"📁", label:"My Files",       sub:"View, download & manage",        path:"/user/files",     c:"#0891b2" },
                { icon:"🌐", label:"All Files",      sub:"Browse & request access",        path:"/user/all-files", c:"#f97316",
                  badge: pending > 0 ? pending : null },
                { icon:"👤", label:"My Profile",     sub:"View & edit your profile",       path:"/user/profile",   c:"#7c3aed" },
              ].map(q => (
                <div key={q.path} className="qcard" style={{ "--qc":q.c }} onClick={() => nav(q.path)}>
                  <div style={{ width:42, height:42, borderRadius:11,
                    background:`${q.c}12`, border:`1.5px solid ${q.c}25`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                    {q.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:".86rem", color:"#0f172a" }}>{q.label}</div>
                    <div style={{ fontSize:".72rem", color:"#94a3b8", marginTop:1 }}>{q.sub}</div>
                  </div>
                  {q.badge && (
                    <div style={{ position:"absolute", top:10, right:10,
                      width:18, height:18, borderRadius:"50%", background:"#ef4444",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:".6rem", fontWeight:800, color:"#fff", fontFamily:"monospace" }}>
                      {q.badge}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* My recent files */}
        <Slide from="bottom" delay={60}>
          <div style={{ background:"#fff", borderRadius:16, padding:"22px",
            boxShadow:"0 1px 12px rgba(0,0,0,.05)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div className="sec-head" style={{ marginBottom:0, border:"none", paddingBottom:0 }}>My Recent Files</div>
              <button onClick={() => nav("/user/files")} style={{
                fontSize:".72rem", fontWeight:700, padding:"5px 13px", borderRadius:7,
                cursor:"pointer", border:"1.5px solid #6ee7b7", background:"#f0fdf4",
                color:"#059669", fontFamily:"'Outfit',sans-serif"
              }}>View All</button>
            </div>
            <div style={{ height:1, background:"#f1f5f9", margin:"10px 0 14px" }} />
            {files.length === 0
              ? <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:".85rem", color:"#94a3b8", marginBottom:12 }}>No files yet.</div>
                  <button onClick={() => nav("/user/upload")} style={{
                    padding:"9px 22px", borderRadius:9, border:"none",
                    background:"linear-gradient(135deg,#059669,#0891b2)",
                    color:"#fff", cursor:"pointer", fontWeight:700,
                    fontSize:".84rem", fontFamily:"'Outfit',sans-serif"
                  }}>Upload Your First File</button>
                </div>
              : <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr>
                        {["#","File Name","Type","Size","Status"].map(h => (
                          <th key={h} style={{ padding:"6px 12px", textAlign:"left",
                            fontSize:".62rem", fontWeight:800, color:"#94a3b8",
                            letterSpacing:1.5, fontFamily:"monospace", textTransform:"uppercase",
                            borderBottom:"2px solid #f1f5f9" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {files.slice(0,6).map((f, i) => {
                        const ext = getExt(f); const ec = getColor(f);
                        return (
                          <tr key={f.id} className="trow" style={{ borderBottom:"1px solid #f8faff" }}>
                            <td style={{ padding:"11px 12px", fontSize:".76rem", color:"#cbd5e1", fontFamily:"monospace" }}>{String(i+1).padStart(2,"0")}</td>
                            <td style={{ padding:"11px 12px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <span style={{ fontSize:".56rem", fontFamily:"monospace", fontWeight:800,
                                  color:ec, background:`${ec}10`, border:`1px solid ${ec}28`,
                                  padding:"2px 7px", borderRadius:5 }}>{ext}</span>
                                <span style={{ fontSize:".85rem", fontWeight:600, color:"#0f172a" }}>{f.fileName}</span>
                              </div>
                            </td>
                            <td style={{ padding:"11px 12px" }}>
                              <span style={{ fontSize:".6rem", color:"#7c3aed", background:"#f5f3ff",
                                border:"1px solid #ddd6fe", padding:"2px 9px", borderRadius:20,
                                fontFamily:"monospace", fontWeight:700 }}>{f.fileType || ext}</span>
                            </td>
                            <td style={{ padding:"11px 12px", fontSize:".78rem", color:"#64748b", fontFamily:"monospace" }}>
                              {f.fileSize ? (f.fileSize/1024).toFixed(1)+" KB" : "—"}
                            </td>
                            <td style={{ padding:"11px 12px" }}>
                              <span style={{ fontSize:".6rem", color:"#059669", background:"#f0fdf4",
                                border:"1px solid #6ee7b7", padding:"2px 9px", borderRadius:20,
                                fontFamily:"monospace", fontWeight:700 }}>ENCRYPTED</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>}
          </div>
        </Slide>
      </div>
    </div>
  );
}