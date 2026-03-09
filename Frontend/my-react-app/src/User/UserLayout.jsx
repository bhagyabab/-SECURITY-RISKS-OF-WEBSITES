import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard",  path: "/user/dashboard" },
  { label: "Upload",     path: "/user/upload" },
  { label: "My Files",   path: "/user/files" },
  { label: "All Files",  path: "/user/all-files" },
  { label: "Profile",    path: "/user/profile" },
];

export default function UserLayout() {
  const nav      = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const userName = sessionStorage.getItem("name") || "User";

  const isDashboard = location.pathname === "/user/dashboard";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    setScrolled(window.scrollY > 10);
    return () => window.removeEventListener("scroll", fn);
  }, [location.pathname]);

  const isActive     = (path) => location.pathname === path;
  const handleLogout = () => { sessionStorage.clear(); nav("/login"); };

  const isTransparent = isDashboard && !scrolled;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html, body { font-family:'Outfit',sans-serif; background:#f0f4ff; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

    .unav-lnk {
      position:relative; cursor:pointer;
      font-size:.88rem; font-weight:500; letter-spacing:.3px;
      padding:4px 0 8px; transition:color .25s;
      border:none; background:none; font-family:'Outfit',sans-serif;
      white-space:nowrap;
    }
    .unav-lnk::after {
      content:''; position:absolute; bottom:0; left:0;
      width:0; height:2.5px; border-radius:2px; transition:width .3s ease;
    }

    .unav-transparent .unav-lnk { color:rgba(255,255,255,.65); }
    .unav-transparent .unav-lnk::after { background:#34d399; }
    .unav-transparent .unav-lnk:hover { color:#fff; }
    .unav-transparent .unav-lnk:hover::after { width:100%; }
    .unav-transparent .unav-lnk.active { color:#fff; font-weight:700; }
    .unav-transparent .unav-lnk.active::after { width:100%; background:#34d399; }

    .unav-solid {
      background:rgba(255,255,255,.97) !important;
      border-bottom:1px solid #e2e8f0 !important;
      box-shadow:0 2px 20px rgba(5,150,105,.07) !important;
    }
    .unav-solid .unav-lnk { color:#64748b; }
    .unav-solid .unav-lnk::after { background:#059669; }
    .unav-solid .unav-lnk:hover { color:#059669; }
    .unav-solid .unav-lnk:hover::after { width:100%; }
    .unav-solid .unav-lnk.active { color:#059669; font-weight:700; }
    .unav-solid .unav-lnk.active::after { width:100%; }

    .nav-div {
      width:1px; height:20px; background:rgba(255,255,255,.2); transition:background .35s;
    }
    .unav-solid .nav-div { background:#e2e8f0; }

    .ulogout-btn {
      padding:7px 16px; border-radius:8px; cursor:pointer;
      font-size:.8rem; font-weight:600; transition:all .22s;
      border:1.5px solid; font-family:'Outfit',sans-serif;
    }
    .unav-transparent .ulogout-btn {
      border-color:rgba(255,255,255,.3); background:rgba(255,255,255,.08);
      color:rgba(255,255,255,.8); backdrop-filter:blur(8px);
    }
    .unav-transparent .ulogout-btn:hover { background:rgba(255,255,255,.2); color:#fff; }
    .unav-solid .ulogout-btn { border-color:#fecaca; background:#fef2f2; color:#ef4444; }
    .unav-solid .ulogout-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; }

    .page-anim { animation:fadeIn .4s ease both; }
  `;

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4ff", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      <nav className={isTransparent ? "unav-transparent" : "unav-solid"}
        style={{ position:"fixed", top:0, left:0, right:0, zIndex:999,
          height:62, padding:"0 5%",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          transition:"all .35s" }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer", flexShrink:0 }}
          onClick={() => nav("/user/dashboard")}>
          <div style={{ width:34, height:34, borderRadius:8, flexShrink:0,
            background:"linear-gradient(135deg,#059669,#0891b2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, boxShadow:"0 4px 12px rgba(5,150,105,.35)" }}>☁️</div>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2,
            color: isTransparent ? "#fff" : "#0f172a", transition:"color .35s" }}>
            Cloud<span style={{ color:"#34d399" }}>Secure</span>
          </span>
        </div>

        {/* Right: nav + divider + user info + logout */}
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          {NAV_ITEMS.map(item => (
            <button key={item.path}
              className={`unav-lnk${isActive(item.path) ? " active" : ""}`}
              onClick={() => nav(item.path)}>
              {item.label}
            </button>
          ))}
          <span className="nav-div" />
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <div style={{ width:30, height:30, borderRadius:8,
              background:"linear-gradient(135deg,#059669,#0891b2)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>👤</div>
            <div>
              <div style={{ fontSize:".78rem", fontWeight:700, lineHeight:1.1,
                color: isTransparent ? "#fff" : "#0f172a", transition:"color .35s" }}>{userName}</div>
              <div style={{ fontSize:".54rem", fontFamily:"monospace", fontWeight:700,
                letterSpacing:1.2, color:"#34d399" }}>USER</div>
            </div>
          </div>
          <button className="ulogout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page-anim">
        <Outlet />
      </div>
    </div>
  );
}