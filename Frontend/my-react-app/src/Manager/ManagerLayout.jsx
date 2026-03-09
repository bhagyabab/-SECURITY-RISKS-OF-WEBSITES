import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard",     path: "/manager/dashboard" },
  { label: "Files",         path: "/manager/files" },
  { label: "Users",         path: "/manager/users" },
  { label: "Notifications", path: "/manager/notifications" },
  { label: "Profile",       path: "/manager/profile" },
];

export default function ManagerLayout() {
  const nav      = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const managerName = sessionStorage.getItem("name") || "Manager";

  const isDashboard = location.pathname === "/manager/dashboard";

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
    html, body { font-family:'Outfit',sans-serif; background:#fff9f0; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

    .mnav-lnk {
      position:relative; cursor:pointer;
      font-size:.88rem; font-weight:500; letter-spacing:.3px;
      padding:4px 0 8px; transition:color .25s;
      border:none; background:none; font-family:'Outfit',sans-serif;
      white-space:nowrap;
    }
    .mnav-lnk::after {
      content:''; position:absolute; bottom:0; left:0;
      width:0; height:2.5px; border-radius:2px; transition:width .3s ease;
    }

    .mnav-transparent .mnav-lnk { color:rgba(255,255,255,.88); }
    .mnav-transparent .mnav-lnk::after { background:#fcd34d; }
    .mnav-transparent .mnav-lnk:hover { color:#fff; }
    .mnav-transparent .mnav-lnk:hover::after { width:100%; }
    .mnav-transparent .mnav-lnk.active { color:#fff; font-weight:700; }
    .mnav-transparent .mnav-lnk.active::after { width:100%; background:#fcd34d; }

    .mnav-solid {
      background:rgba(255,255,255,.97) !important;
      border-bottom:1px solid #fde68a !important;
      box-shadow:0 2px 20px rgba(217,119,6,.08) !important;
    }
    .mnav-solid .mnav-lnk { color:#78716c; }
    .mnav-solid .mnav-lnk::after { background:#d97706; }
    .mnav-solid .mnav-lnk:hover { color:#d97706; }
    .mnav-solid .mnav-lnk:hover::after { width:100%; }
    .mnav-solid .mnav-lnk.active { color:#d97706; font-weight:700; }
    .mnav-solid .mnav-lnk.active::after { width:100%; }

    .mnav-divider {
      width:1px; height:20px; background:rgba(255,255,255,.25);
      transition:background .35s;
    }
    .mnav-solid .mnav-divider { background:#fde68a; }

    .mlogout-btn {
      padding:7px 16px; border-radius:8px; cursor:pointer;
      font-size:.8rem; font-weight:600; transition:all .22s;
      border:1.5px solid; font-family:'Outfit',sans-serif; white-space:nowrap;
    }
    .mnav-transparent .mlogout-btn {
      border-color:rgba(255,255,255,.3); background:rgba(255,255,255,.1);
      color:rgba(255,255,255,.85); backdrop-filter:blur(8px);
    }
    .mnav-transparent .mlogout-btn:hover {
      background:rgba(255,255,255,.22); color:#fff; border-color:rgba(255,255,255,.55);
    }
    .mnav-solid .mlogout-btn {
      border-color:#fde68a; background:#fffbeb; color:#d97706;
    }
    .mnav-solid .mlogout-btn:hover { background:#d97706; color:#fff; border-color:#d97706; }

    .page-anim { animation:fadeIn .4s ease both; }
  `;

  return (
    <div style={{ minHeight:"100vh", background:"#fff9f0", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      <nav
        className={isTransparent ? "mnav-transparent" : "mnav-solid"}
        style={{
          position:"fixed", top:0, left:0, right:0, zIndex:999,
          height:62, padding:"0 5%",
          display:"flex", alignItems:"center",
          justifyContent:"space-between",
          transition:"all .35s"
        }}
      >
        {/* Logo */}
        <div
          style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer", flexShrink:0 }}
          onClick={() => nav("/manager/dashboard")}
        >
          <div style={{
            width:34, height:34, borderRadius:8, flexShrink:0,
            background:"linear-gradient(135deg,#d97706,#f59e0b)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, boxShadow:"0 4px 12px rgba(217,119,6,.35)"
          }}>🗂️</div>
          <span style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2,
            color: isTransparent ? "#fff" : "#1c1917", transition:"color .35s"
          }}>
            Cloud<span style={{ color:"#fbbf24" }}>Secure</span>
          </span>
        </div>

        {/* Right: nav + divider + manager info + logout */}
        <div style={{ display:"flex", alignItems:"center", gap:28 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`mnav-lnk${isActive(item.path) ? " active" : ""}`}
              onClick={() => nav(item.path)}
            >
              {item.label}
            </button>
          ))}

          <span className="mnav-divider" />

          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <div style={{
              width:30, height:30, borderRadius:8,
              background:"linear-gradient(135deg,#d97706,#f59e0b)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:13
            }}>🗂️</div>
            <div>
              <div style={{
                fontSize:".78rem", fontWeight:700, lineHeight:1.1,
                color: isTransparent ? "#fff" : "#1c1917", transition:"color .35s"
              }}>{managerName}</div>
              <div style={{
                fontSize:".54rem", fontFamily:"monospace", fontWeight:700,
                letterSpacing:1.2, color:"#fbbf24"
              }}>MANAGER</div>
            </div>
          </div>

          <button className="mlogout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page-anim">
        <Outlet />
      </div>
    </div>
  );
}