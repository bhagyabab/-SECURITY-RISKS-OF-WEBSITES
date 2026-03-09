import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/admin/dashboard" },
  { label: "Users",        path: "/admin/users" },
  { label: "Files",        path: "/admin/files" },
  { label: "Notifications",path: "/admin/notifications" },
];

export default function AdminLayout() {
  const nav      = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const adminName = sessionStorage.getItem("name") || "Admin";

  const isDashboard = location.pathname === "/admin/dashboard";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    // Reset scroll state on route change
    setScrolled(window.scrollY > 10);
    return () => window.removeEventListener("scroll", fn);
  }, [location.pathname]);

  const isActive     = (path) => location.pathname === path;
  const handleLogout = () => { sessionStorage.clear(); nav("/login"); };

  // Transparent ONLY on dashboard when not scrolled — solid everywhere else
  const isTransparent = isDashboard && !scrolled;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    html, body { font-family:'Outfit',sans-serif; background:#f0f4ff; }

    @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

    .nav-lnk {
      position:relative; cursor:pointer;
      font-size:.88rem; font-weight:500; letter-spacing:.3px;
      padding:4px 0 8px; transition:color .25s;
      border:none; background:none; font-family:'Outfit',sans-serif;
      white-space:nowrap;
    }
    .nav-lnk::after {
      content:''; position:absolute; bottom:0; left:0;
      width:0; height:2.5px; border-radius:2px; transition:width .3s ease;
    }

    /* transparent — dashboard only, not scrolled */
    .nav-transparent .nav-lnk { color:rgba(255,255,255,.93); }
    .nav-transparent .nav-lnk::after { background:#60a5fa; }
    .nav-transparent .nav-lnk:hover { color:#fff; }
    .nav-transparent .nav-lnk:hover::after { width:100%; }
    .nav-transparent .nav-lnk.active { color:#fff; font-weight:700; }
    .nav-transparent .nav-lnk.active::after { width:100%; background:#60a5fa; }

    /* solid — all other pages + dashboard when scrolled */
    .nav-solid {
      background:rgba(255,255,255,.97) !important;
      border-bottom:1px solid #e2e8f0 !important;
      box-shadow:0 2px 20px rgba(37,99,235,.07) !important;
    }
    .nav-solid .nav-lnk { color:#64748b; }
    .nav-solid .nav-lnk::after { background:#2563eb; }
    .nav-solid .nav-lnk:hover { color:#2563eb; }
    .nav-solid .nav-lnk:hover::after { width:100%; }
    .nav-solid .nav-lnk.active { color:#2563eb; font-weight:700; }
    .nav-solid .nav-lnk.active::after { width:100%; }

    .nav-divider {
      width:1px; height:20px; background:rgba(255,255,255,.2);
      transition:background .35s;
    }
    .nav-solid .nav-divider { background:#e2e8f0; }

    .logout-btn {
      padding:7px 16px; border-radius:8px; cursor:pointer;
      font-size:.8rem; font-weight:600; transition:all .22s;
      border:1.5px solid; font-family:'Outfit',sans-serif; white-space:nowrap;
    }
    .nav-transparent .logout-btn {
      border-color:rgba(255,255,255,.3); background:rgba(255,255,255,.08);
      color:rgba(255,255,255,.8); backdrop-filter:blur(8px);
    }
    .nav-transparent .logout-btn:hover {
      background:rgba(255,255,255,.2); color:#fff; border-color:rgba(255,255,255,.55);
    }
    .nav-solid .logout-btn {
      border-color:#fecaca; background:#fef2f2; color:#ef4444;
    }
    .nav-solid .logout-btn:hover { background:#ef4444; color:#fff; border-color:#ef4444; }

    .page-anim { animation:fadeIn .4s ease both; }
  `;

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4ff", fontFamily:"'Outfit',sans-serif" }}>
      <style>{CSS}</style>

      <nav
        className={isTransparent ? "nav-transparent" : "nav-solid"}
        style={{
          position:"fixed", top:0, left:0, right:0, zIndex:999,
          height:62, padding:"0 5%",
          display:"flex", alignItems:"center",
          justifyContent:"space-between",
          transition:"all .35s"
        }}
      >
        {/* LEFT: Logo */}
        <div
          style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer", flexShrink:0 }}
          onClick={() => nav("/admin/dashboard")}
        >
          <div style={{
            width:34, height:34, borderRadius:8, flexShrink:0,
            background:"linear-gradient(135deg,#2563eb,#7c3aed)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, boxShadow:"0 4px 12px rgba(37,99,235,.35)"
          }}>🔐</div>
          <span style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2,
            color: isTransparent ? "#fff" : "#0f172a", transition:"color .35s"
          }}>
            Cloud<span style={{ color:"#60a5fa" }}>Secure</span>
          </span>
        </div>

        {/* RIGHT: Nav + divider + admin info + logout */}
        <div style={{ display:"flex", alignItems:"center", gap:28 }}>

          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`nav-lnk${isActive(item.path) ? " active" : ""}`}
              onClick={() => nav(item.path)}
            >
              {item.label}
            </button>
          ))}

          <span className="nav-divider" />

          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <div style={{
              width:30, height:30, borderRadius:8, flexShrink:0,
              background:"linear-gradient(135deg,#2563eb,#7c3aed)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:13
            }}>🛡️</div>
            <div>
              <div style={{
                fontSize:".78rem", fontWeight:700, lineHeight:1.1,
                color: isTransparent ? "#fff" : "#0f172a", transition:"color .35s"
              }}>{adminName}</div>
              <div style={{
                fontSize:".54rem", fontFamily:"monospace", fontWeight:700,
                letterSpacing:1.2, color:"#60a5fa"
              }}>ADMINISTRATOR</div>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="page-anim">
        <Outlet />
      </div>
    </div>
  );
}