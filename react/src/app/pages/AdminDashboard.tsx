import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Mail,
  Users,
  Shield,
  LogOut,
  Bell,
} from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Fetch unread notification count from backend ─────────────────────────
  useEffect(() => {
    const token =
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      "";

    fetch("http://127.0.0.1:8000/admin-notifications/unread-count/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.count ?? 0))
      .catch(() => setUnreadCount(5)); // demo fallback
  }, []);

  // ── Sign out (original logic preserved) ──────────────────────────────────
  const handleSignOut = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── Nav card data ─────────────────────────────────────────────────────────
  const cards = [
    {
      label: "Mails",
      description: "View all system emails",
      route: "/admin/mails",
      icon: <Mail size={24} style={{ color: "#FAF3E7" }} />,
      iconBg: "linear-gradient(135deg,#B89B5E,#A6874E)",
      iconShadow: "0 6px 20px rgba(184,155,94,0.35)",
      badge: 0,
    },
    {
      label: "User Profiles",
      description: "Manage registered users",
      route: "/adminusers",
      icon: <Users size={24} style={{ color: "#B89B5E" }} />,
      iconBg: "linear-gradient(135deg,#3B2A23,#6B4232)",
      iconShadow: "0 6px 20px rgba(59,42,35,0.35)",
      badge: 0,
    },
    {
      label: "Messages",
      description: "System notifications & alerts",
      route: "/admin-notifications",
      icon: <Bell size={24} style={{ color: "#FAF3E7" }} />,
      iconBg: "linear-gradient(135deg,#5B3A2A,#8B5E3C)",
      iconShadow: "0 6px 20px rgba(91,58,42,0.35)",
      badge: unreadCount,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF3E7" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-16"
        style={{
          background: "rgba(59,42,35,0.92)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          borderBottom: "1px solid rgba(184,155,94,0.18)",
          boxShadow: "0 4px 24px rgba(59,42,35,0.18)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(184,155,94,0.15)",
              border: "1px solid rgba(184,155,94,0.35)",
            }}
          >
            <Shield size={15} style={{ color: "#B89B5E" }} />
          </div>
          <div>
            <p
              style={{
                fontFamily: "Orbitron, sans-serif",
                color: "#FAF3E7",
                fontSize: "0.95rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              Admin Panel
            </p>
            <p
              style={{
                fontSize: "0.62rem",
                color: "rgba(250,243,231,0.5)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              Qumail · Administrator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live unread pill in header */}
          {unreadCount > 0 && (
            <button
              onClick={() => navigate("/admin/notifications")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                background: "rgba(204,0,0,0.1)",
                border: "1px solid rgba(204,0,0,0.25)",
              }}
            >
              <Bell size={12} style={{ color: "#ff9d9d" }} />
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.57rem",
                  color: "#ff9d9d",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                {unreadCount} unread
              </span>
            </button>
          )}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              background: "rgba(204,0,0,0.12)",
              border: "1px solid rgba(204,0,0,0.28)",
              color: "#ff9d9d",
              fontFamily: "Orbitron, sans-serif",
              fontSize: "0.58rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Welcome */}
        <div className="text-center mb-12">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: "linear-gradient(135deg,#B89B5E,#A6874E)",
              boxShadow: "0 8px 24px rgba(184,155,94,0.35)",
            }}
          >
            <Shield size={28} style={{ color: "#FAF3E7" }} />
          </div>
          <p
            style={{
              fontFamily: "Orbitron, sans-serif",
              color: "#3B2A23",
              fontSize: "1.4rem",
              fontWeight: 800,
              letterSpacing: "0.04em",
              marginBottom: 8,
            }}
          >
            Admin Dashboard
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#7A6D63",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            Select a section to manage
          </p>
        </div>

        {/* Three nav cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-2xl">
          {cards.map((card) => (
            <button
              key={card.label}
              onClick={() => navigate(card.route)}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: "#FFFDF9",
                border: "1px solid #E6DDD2",
                boxShadow: "0 4px 24px rgba(59,42,35,0.07)",
              }}
            >
              {/* Icon container with badge */}
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                  style={{
                    background: card.iconBg,
                    boxShadow: card.iconShadow,
                  }}
                >
                  {card.icon}
                </div>

                {/* Unread badge — only on Messages */}
                {card.badge > 0 && (
                  <span
                    className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5"
                    style={{
                      background: "linear-gradient(135deg,#cc0000,#aa0000)",
                      boxShadow: "0 2px 10px rgba(204,0,0,0.5)",
                      fontFamily: "Orbitron, sans-serif",
                      fontSize: "0.5rem",
                      fontWeight: 800,
                      color: "#FAF3E7",
                      letterSpacing: "0.02em",
                      border: "2px solid #FFFDF9",
                    }}
                  >
                    {card.badge > 99 ? "99+" : card.badge}
                  </span>
                )}
              </div>

              <div className="text-center">
                <p
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    color: "#3B2A23",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  {card.label}
                </p>
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "#7A6D63",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {card.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
