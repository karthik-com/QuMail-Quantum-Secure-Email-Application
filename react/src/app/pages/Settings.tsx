import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Edit3,
  Check,
  X,
  Shield,
  LogOut,
  Lock,
  Send,
  Inbox,
  Info,
  FileText,
  HelpCircle,
  Code2,
  ChevronRight,
  Activity,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { ProfileDropdown } from "../components/ProfileDropdown";
import { logout } from "../utils/auth";

const accent = "#B89B5E";
const txtPrimary = "#3B2A23";
const txtSecondary = "#7A6D63";

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#F8F2E8",
        border: "1px solid #DCCFC0",
        boxShadow: "0 8px 24px rgba(59,42,35,0.08)",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-4"
      style={{ borderBottom: "1px solid #E6DDD2", background: "rgba(184,155,94,0.04)" }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(184,155,94,0.12)", color: accent }}>
        {icon}
      </div>
      <span style={{ fontFamily: "Orbitron, sans-serif", color: txtPrimary, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
        {title}
      </span>
    </div>
  );
}

function RowDivider() {
  return <div style={{ height: "1px", background: "#E6DDD2", marginLeft: "3.5rem" }} />;
}

export default function Settings() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneTemp, setPhoneTemp] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [stats, setStats] = useState({ emails_sent: 0, emails_received: 0 });
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteStep, setDeleteStep] = useState<"confirm" | "deleting" | "done">("confirm");

  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchActivityStatistics = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/activity-statistics/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
      console.error("Activity statistics error:", data);
      return;
    }
      setStats({ emails_sent: data.emails_sent ?? 0, emails_received: data.emails_received ?? 0});
      setRecentLogins(data.recent_login_history || []);
    } catch (err) {
      console.error("Failed to fetch activity statistics:", err);
      setRecentLogins([]);
    }
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem("access");
    if (!token) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/profile/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile.");
      const data = await res.json();
      setFullName(data.username);
      setEmail(data.email);
      setPhone(data.phone);
      setPhoneTemp(data.phone);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchActivityStatistics();
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "delete-anim";
    style.textContent = `
      @keyframes progress-fill { from { width: 0% } to { width: 100% } }
      @keyframes ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
    `;
    if (!document.getElementById("delete-anim")) document.head.appendChild(style);
    return () => { document.getElementById("delete-anim")?.remove(); };
  }, []);

  const handlePhoneSave = async () => {
    const digits = phoneTemp.replace(/\D/g, "");
    if (digits.length < 10) { setPhoneError("Enter a valid phone number."); return; }
    try {
      const token = localStorage.getItem("access");
      const res = await fetch("http://127.0.0.1:8000/update-phone/", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phoneTemp }),
      });
      const data = await res.json();
      if (res.ok) {
        setPhone(phoneTemp);
        setEditingPhone(false);
        setPhoneError("");
        showToast("Phone number updated successfully.");
      } else {
        setPhoneError(data.error || "Failed to update phone.");
      }
    } catch (err) {
      setPhoneError("Server error.");
    }
  };

  const handlePhoneCancel = () => {
    setPhoneTemp(phone);
    setPhoneError("");
    setEditingPhone(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== "delete my account") return;
    if (!deletePassword.trim()) { setDeleteError("Password is required."); return; }
    setDeleteError("");
    setDeleteStep("deleting");
    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://127.0.0.1:8000/delete-account/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setDeleteStep("confirm");
        setDeleteError(data.error || "Unable to delete account.");
        return;
      }
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setDeleteStep("done");
      setTimeout(() => { navigate("/login"); }, 1500);
    } catch (err) {
      setDeleteStep("confirm");
      setDeleteError("Server error.");
    }
  };

  const requestSignOut = () => setShowSignOutDialog(true);

  const confirmSignOut = async () => {
    setSigningOut(true);
    try {
      const result = await logout();
      if (!result.ok) showToast(result.message || "Logout failed.", false);
    } finally {
      setSigningOut(false);
      setShowSignOutDialog(false);
      navigate("/login");
    }
  };

  const cancelSignOut = () => setShowSignOutDialog(false);

  const initials = fullName.replace(/\s+/g, "").slice(0, 2).toUpperCase() || "AQ";

  const getShortDeviceName = (deviceString: string) => {
    if (!deviceString) return "Unknown Device";
    const browser = deviceString.match(/(Edg|Edge)\/[\d.]+/i)
      ? "Edge"
      : deviceString.match(/OPR\/[\d.]+/i)
      ? "Opera"
      : deviceString.match(/Chrome\/[\d.]+/i)
      ? "Chrome"
      : deviceString.match(/Firefox\/[\d.]+/i)
      ? "Firefox"
      : deviceString.match(/Safari\/[\d.]+/i)
      ? "Safari"
      : deviceString.match(/MSIE |Trident\//i)
      ? "Internet Explorer"
      : "Browser";
    const osMatch = deviceString.match(/\(([^)]+)\)/);
    const osPart = osMatch?.[1] ?? "";
    const os = osPart.match(/Windows/i)
      ? "Windows"
      : osPart.match(/Macintosh|Mac OS X/i)
      ? "Mac"
      : osPart.match(/Android/i)
      ? "Android"
      : osPart.match(/Linux/i)
      ? "Linux"
      : osPart.match(/iPhone|iPad|iPod/i)
      ? "iOS"
      : osPart.split(";")[0]?.trim() || "";
    return os ? `${browser} • ${os}` : browser || "Unknown Device";
  };

  const infoItems = [
    { icon: <Info size={15} />, label: "About Qumail", meta: "" },
    { icon: <FileText size={15} />, label: "App Version", meta: "v2.4.1" },
    { icon: <Shield size={15} />, label: "Privacy Policy", meta: "" },
    { icon: <FileText size={15} />, label: "Terms of Service", meta: "" },
    { icon: <HelpCircle size={15} />, label: "Contact Support", meta: "" },
    { icon: <Code2 size={15} />, label: "Developer Information", meta: "" },
  ];

  const informationData: Record<string, string> = {
    "About Qumail":
      "Qumail is a quantum-secure email communication platform designed to provide private and encrypted digital communication.",
    "App Version":
      "You are currently using Qumail Application version 2.4.1.",
    "Privacy Policy":
      "Qumail protects your communication using encryption and secure authentication mechanisms. Your email data is handled securely within the application.",
    "Terms of Service":
      "By using Qumail, you agree to use the application responsibly and only for lawful communication.",
    "Contact Support":
      "For queries, technical issues, or assistance, please contact admin123@qumail.io.",
    "Developer Information":
      "Qumail is a quantum-secure email communication project developed with a focus on secure and privacy-preserving digital communication.",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF3E7" }}>
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-40 flex items-center gap-3 px-4 h-16"
        style={{
          background: "rgba(59,42,35,0.92)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          borderBottom: "1px solid rgba(184,155,94,0.18)",
          boxShadow: "0 4px 24px rgba(59,42,35,0.18)",
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 flex-shrink-0"
          style={{ background: "rgba(184,155,94,0.15)", border: "1px solid rgba(184,155,94,0.35)", color: "#B89B5E" }}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1">
          <p style={{ fontFamily: "Orbitron, sans-serif", color: "#FAF3E7", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.06em" }}>
            Settings
          </p>
          <p style={{ fontSize: "0.65rem", color: "rgba(250,243,231,0.55)", fontFamily: "JetBrains Mono, monospace" }}>
            Qumail · Account Preferences
          </p>
        </div>

        <ProfileDropdown isDark={false} />
      </header>

      {/* Main Scroll Area */}
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-14">

          {/* Profile Banner */}
          <SectionCard>
            <div
              className="relative px-5 pt-8 pb-6 flex flex-col items-center text-center"
              style={{ background: "#F8F2E8" }}
            >
              <div className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(184,155,94,0.12)", color: accent }}>
                <SettingsIcon size={13} />
              </div>

              <div className="relative mb-4">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 88,
                    height: 88,
                    background: "linear-gradient(135deg, #3B2A23 0%, #6B4232 60%, #8B5E3C 100%)",
                    boxShadow: "0 0 0 3px rgba(184,155,94,0.35), 0 0 0 6px rgba(184,155,94,0.1), 0 12px 30px rgba(59,42,35,0.35)",
                    fontFamily: "Orbitron, sans-serif",
                    color: "#B89B5E",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </div>
                <div
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #00ff88, #00cc66)", border: "2.5px solid #FFFDF9" }}
                >
                  <Check size={11} color="#030b1a" strokeWidth={3} />
                </div>
              </div>

              <p style={{ fontFamily: "Orbitron, sans-serif", color: txtPrimary, fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px" }}>{fullName}</p>
              <p style={{ fontSize: "0.75rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace", marginBottom: "12px" }}>{email}</p>

              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(0,170,85,0.1)", border: "1px solid rgba(0,170,85,0.22)", color: "#00aa55", fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.06em" }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00aa55", display: "inline-block", flexShrink: 0 }} />
                Quantum Verified Account
              </div>
            </div>
          </SectionCard>

          {/* Profile Information */}
          <SectionCard>
            <SectionHeader icon={<User size={15} />} title="Profile Information" />
            <div className="px-5 py-3 space-y-0.5">
              <div className="flex items-center gap-3 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(184,155,94,0.1)", color: accent }}>
                  <User size={15} />
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: "0.67rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace", marginBottom: 2 }}>FULL NAME</p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: txtPrimary }}>{fullName}</p>
                </div>
              </div>

              <RowDivider />

              <div className="flex items-center gap-3 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(184,155,94,0.1)", color: accent }}>
                  <Mail size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.67rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace", marginBottom: 2 }}>EMAIL ADDRESS</p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: txtPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
                </div>
                <span className="flex-shrink-0" style={{ background: "rgba(184,155,94,0.12)", color: accent, fontFamily: "JetBrains Mono, monospace", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 6 }}>
                  PRIMARY
                </span>
              </div>

              <RowDivider />

              <div className="flex items-start gap-3 py-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(184,155,94,0.1)", color: accent }}>
                  <Phone size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "0.67rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>PHONE NUMBER</p>
                  {editingPhone ? (
                    <div className="space-y-1.5">
                      <input
                        type="tel"
                        value={phoneTemp}
                        onChange={(e) => { setPhoneTemp(e.target.value); setPhoneError(""); }}
                        className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                        style={{
                          background: "#FAF3E7",
                          border: phoneError ? "1.5px solid rgba(255,68,68,0.5)" : `1.5px solid ${accent}`,
                          color: txtPrimary,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                        autoFocus
                        placeholder="+1 (555) 000-0000"
                      />
                      {phoneError && <p style={{ fontSize: "0.7rem", color: "#ff4444", fontFamily: "JetBrains Mono, monospace" }}>{phoneError}</p>}
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: txtPrimary, fontFamily: "JetBrains Mono, monospace" }}>{phone}</p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                  {editingPhone ? (
                    <>
                      <button onClick={handlePhoneSave} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: "linear-gradient(135deg, #B89B5E, #A6874E)", color: "#FAF3E7" }} title="Save">
                        <Check size={14} strokeWidth={2.5} />
                      </button>
                      <button onClick={handlePhoneCancel} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.25)", color: "#cc0000" }} title="Cancel">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingPhone(true); setPhoneTemp(phone); }} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: "rgba(184,155,94,0.12)", border: "1px solid rgba(184,155,94,0.28)", color: accent }} title="Edit phone number">
                      <Edit3 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Security */}
          <SectionCard>
            <SectionHeader icon={<Lock size={15} />} title="Security" />
            <div className="px-5 py-3 space-y-1">
              <button onClick={() => navigate("/change-password")} className="w-full flex items-center gap-3 py-3.5 rounded-xl transition-all duration-200 hover:opacity-80">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(184,155,94,0.1)", color: accent }}>
                  <Lock size={15} />
                </div>
                <div className="flex-1 text-left">
                  <p style={{ fontSize: "0.88rem", fontWeight: 600, color: txtPrimary }}>Change Password</p>
                  <p style={{ fontSize: "0.7rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace" }}>Update your quantum-secured credentials</p>
                </div>
                <ChevronRight size={16} style={{ color: txtSecondary }} />
              </button>

              <RowDivider />

              
            </div>
          </SectionCard>

          {/* Activity & Statistics */}
          <SectionCard>
            <SectionHeader icon={<Activity size={15} />} title="Activity & Statistics" />

            <div className="grid grid-cols-2 gap-3 px-5 pt-4">
              {[
                { label: "Emails Sent", value: stats.emails_sent, icon: <Send size={16} />, color: accent, bg: "rgba(184,155,94,0.1)" },
                { label: "Emails Received", value: stats.emails_received, icon: <Inbox size={16} />, color: "#A6874E", bg: "rgba(166,135,78,0.1)" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(59,42,35,0.03)", border: "1px solid #E6DDD2" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                  <p style={{ fontFamily: "Orbitron, sans-serif", color: s.color, fontSize: "1.25rem", fontWeight: 800, marginBottom: 2 }}>{s.value}</p>
                  <p style={{ fontSize: "0.7rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace" }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="px-5 pt-4 pb-4">
              <p style={{ fontSize: "0.67rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace", marginBottom: 10, letterSpacing: "0.06em" }}>
                RECENT LOGIN HISTORY
              </p>
              <div className="space-y-2">
                {recentLogins.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-3.5 py-3 rounded-xl" style={{ background: "rgba(59,42,35,0.025)", border: "1px solid #E6DDD2" }}>
                    {entry.status === "SUCCESS" ? (
                      <CheckCircle size={14} style={{ color: "#00aa55", flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={14} style={{ color: "#cc0000", flexShrink: 0 }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: "0.82rem", fontWeight: 500, color: txtPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getShortDeviceName(entry.device)}</p>
                      <p style={{ fontSize: "0.68rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace" }}>{entry.login_time}</p>
                    </div>
                    <span style={{
                      background: entry.status === "SUCCESS" ? "rgba(0,170,85,0.08)" : "rgba(204,0,0,0.08)",
                      color: entry.status === "SUCCESS" ? "#00aa55" : "#cc0000",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 20,
                      flexShrink: 0,
                      letterSpacing: "0.04em",
                    }}>
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Information */}
          <SectionCard>
            <SectionHeader icon={<Info size={15} />} title="Information" />
            <div className="px-5 py-3">
              {infoItems.map((item, idx) => (
                <div key={item.label}>
                  <button
                    onClick={() =>
                      setActiveInfo(
                        activeInfo === item.label ? null : item.label
                      )
                    }
                    className="w-full flex items-center gap-3 py-3.5 transition-all duration-150 hover:opacity-75 text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(184,155,94,0.08)",
                        color: accent,
                      }}
                    >
                      {item.icon}
                    </div>
                    <span
                      style={{
                        flex: 1,
                        fontSize: "0.88rem",
                        fontWeight: 500,
                        color: txtPrimary,
                      }}
                    >
                      {item.label}
                    </span>
                    {item.meta && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: txtSecondary,
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        {item.meta}
                      </span>
                    )}
                    <ChevronRight
                      size={15}
                      style={{
                        color: txtSecondary,
                        flexShrink: 0,
                        transform:
                          activeInfo === item.label
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>

                  {activeInfo === item.label && (
                    <div
                      className="mx-2 mb-3 px-4 py-3 rounded-xl"
                      style={{
                        background: "rgba(184,155,94,0.07)",
                        border: "1px solid rgba(184,155,94,0.18)",
                        color: txtSecondary,
                        fontSize: "0.75rem",
                        lineHeight: 1.6,
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                    >
                      {informationData[item.label]}
                    </div>
                  )}

                  {idx < infoItems.length - 1 && <RowDivider />}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Account Actions — red, destructive section */}
          <SectionCard>
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid rgba(204,0,0,0.07)", background: "rgba(204,0,0,0.015)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(204,0,0,0.1)", color: "#b80000" }}>
                <LogOut size={15} />
              </div>
              <span style={{ fontFamily: "Orbitron, sans-serif", color: "#b80000", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Account Actions
              </span>
            </div>

            <div className="px-5 py-4 space-y-3">
              <button
                onClick={requestSignOut}
                className="w-full py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "rgba(204,0,0,0.07)", border: "1px solid rgba(204,0,0,0.2)", color: "#b80000", fontFamily: "Orbitron, sans-serif", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
              >
                <LogOut size={14} />
                Sign Out
              </button>

              <div className="flex items-center gap-3">
                <div style={{ flex: 1, height: 1, background: "rgba(204,0,0,0.1)" }} />
                <span style={{ fontSize: "0.6rem", color: "rgba(184,0,0,0.62)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>Danger Zone</span>
                <div style={{ flex: 1, height: 1, background: "rgba(204,0,0,0.1)" }} />
              </div>

              <div className="rounded-2xl p-4" style={{ background: "rgba(204,0,0,0.04)", border: "1px solid rgba(204,0,0,0.15)" }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(204,0,0,0.1)", color: "#b80000" }}>
                    <Trash2 size={15} />
                  </div>
                  <div>
                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#b80000", marginBottom: 3 }}>Delete Account</p>
                    <p style={{ fontSize: "0.72rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6 }}>
                      Permanently delete your Qumail account, all emails, and associated data. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDeleteDialog(true); setDeleteConfirmText(""); setDeletePassword(""); setDeleteError(""); setDeleteStep("confirm"); }}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: "linear-gradient(135deg, rgba(204,0,0,0.12), rgba(150,0,0,0.12))", border: "1px solid rgba(204,0,0,0.3)", color: "#9e0000", fontFamily: "Orbitron, sans-serif", fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  <Trash2 size={13} />
                  Delete My Account
                </button>
              </div>
            </div>
          </SectionCard>

          <p className="text-center pb-2" style={{ fontSize: "0.65rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace", opacity: 0.45 }}>
            © Qumail 2026 · Quantum Secure Email Communication
          </p>
        </div>
      </main>

      {/* Sign Out Confirmation Dialog */}
      {showSignOutDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(59,42,35,0.72)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          onClick={() => { if (!signingOut) cancelSignOut(); }}
        >
          <div
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: "#FFFDF9", border: "1px solid #E6DDD2", boxShadow: "0 32px 80px rgba(59,42,35,0.22)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-7 pb-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(184,155,94,0.12)", border: "1.5px solid rgba(184,155,94,0.3)" }}>
                <LogOut size={24} style={{ color: accent }} />
              </div>
              <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "1rem", fontWeight: 800, color: txtPrimary, marginBottom: 8, letterSpacing: "0.02em" }}>Sign Out?</p>
              <p style={{ fontSize: "0.8rem", color: txtSecondary, lineHeight: 1.6, marginBottom: 22 }}>
                {"You'll need to sign back in to access your secure mail."}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelSignOut}
                  disabled={signingOut}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: "rgba(184,155,94,0.1)", border: "1px solid rgba(184,155,94,0.28)", color: accent, fontFamily: "Orbitron, sans-serif", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSignOut}
                  disabled={signingOut}
                  className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #cc0000, #880000)", color: "#ffffff", fontFamily: "Orbitron, sans-serif", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", boxShadow: "0 4px 22px rgba(204,0,0,0.25)" }}
                >
                  <LogOut size={13} />
                  {signingOut ? "Signing Out…" : "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(59,42,35,0.72)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          onClick={() => { if (deleteStep === "confirm") setShowDeleteDialog(false); }}
        >
          <div
            className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: "#FFFDF9", border: "1px solid rgba(204,0,0,0.22)", boxShadow: "0 32px 80px rgba(59,42,35,0.22)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {deleteStep === "confirm" && (
              <>
                <div className="px-6 pt-6 pb-5 text-center" style={{ borderBottom: "1px solid rgba(204,0,0,0.08)", background: "linear-gradient(160deg, rgba(204,0,0,0.04) 0%, rgba(255,253,249,0) 100%)" }}>
                  <div className="flex justify-center mb-4">
                    <div className="relative w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(204,0,0,0.09)", border: "1.5px solid rgba(204,0,0,0.25)" }}>
                      <TriangleAlert size={28} style={{ color: "#cc0000" }} />
                      <div className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(204,0,0,0.15)", animation: "ping 1.5s ease-out infinite", opacity: 0.6 }} />
                    </div>
                  </div>
                  <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "1.05rem", fontWeight: 800, color: "#cc0000", marginBottom: 8, letterSpacing: "0.04em" }}>Delete Account?</p>
                  <p style={{ fontSize: "0.8rem", color: txtSecondary, lineHeight: 1.65 }}>
                    This will permanently erase your account, all emails, contacts, and quantum encryption keys.
                    <strong style={{ color: "#aa0000" }}> This cannot be undone.</strong>
                  </p>
                </div>

                <div className="px-6 py-4">
                  <p style={{ fontSize: "0.65rem", color: "rgba(180,0,0,0.65)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                    The following will be permanently deleted:
                  </p>
                  {["All emails and attachments", "Quantum encryption keys", "Account profile & settings", "Login history & active sessions"].map((item) => (
                    <div key={item} className="flex items-center gap-2 mb-2">
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#cc0000", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.78rem", color: txtSecondary }}>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="px-6 pb-5" style={{ borderTop: "1px solid rgba(204,0,0,0.07)", paddingTop: 16 }}>
                  <p style={{ fontSize: "0.72rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
                    Type <span style={{ color: "#cc0000", fontWeight: 700 }}>delete my account</span> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete my account"
                    className="w-full px-4 py-3 rounded-xl outline-none mb-4 text-sm"
                    style={{
                      background: "rgba(204,0,0,0.04)",
                      border: deleteConfirmText.trim().toLowerCase() === "delete my account" ? "1.5px solid rgba(204,0,0,0.4)" : "1.5px solid rgba(204,0,0,0.15)",
                      color: txtPrimary,
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                    autoFocus
                  />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                    className="w-full px-4 py-3 rounded-xl outline-none mb-4 text-sm"
                    style={{ background: "rgba(204,0,0,0.04)", border: "1.5px solid rgba(204,0,0,0.15)", color: txtPrimary, fontFamily: "JetBrains Mono, monospace" }}
                  />
                  {deleteError && <p style={{ color: "#ff4444", fontSize: "0.72rem", marginBottom: "10px", fontFamily: "JetBrains Mono, monospace" }}>{deleteError}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteDialog(false)}
                      className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02]"
                      style={{ background: "rgba(184,155,94,0.1)", border: "1px solid rgba(184,155,94,0.28)", color: accent, fontFamily: "Orbitron, sans-serif", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText.trim().toLowerCase() !== "delete my account" || deletePassword.trim() === ""}
                      className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] disabled:opacity-35 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(135deg, #cc0000, #880000)",
                        color: "#ffffff",
                        fontFamily: "Orbitron, sans-serif",
                        fontSize: "0.62rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        boxShadow: deleteConfirmText.trim().toLowerCase() === "delete my account" ? "0 4px 22px rgba(204,0,0,0.3)" : "none",
                      }}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}

            {deleteStep === "deleting" && (
              <div className="px-8 py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(204,0,0,0.09)", border: "1.5px solid rgba(204,0,0,0.25)", animation: "pulse 1s ease-in-out infinite" }}>
                  <Trash2 size={26} style={{ color: "#cc0000" }} />
                </div>
                <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#cc0000", marginBottom: 6 }}>Deleting Account…</p>
                <p style={{ fontSize: "0.75rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace" }}>Erasing all data securely</p>
                <div className="w-full mt-6 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(204,0,0,0.08)" }}>
                  <div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #ff4444, #aa0000)", animation: "progress-fill 2s linear forwards", width: "0%" }} />
                </div>
              </div>
            )}

            {deleteStep === "done" && (
              <div className="px-8 py-12 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(0,170,85,0.08)", border: "1.5px solid rgba(0,170,85,0.22)" }}>
                  <CheckCircle size={26} style={{ color: "#00aa55" }} />
                </div>
                <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#00aa55", marginBottom: 6 }}>Account Deleted</p>
                <p style={{ fontSize: "0.75rem", color: txtSecondary, fontFamily: "JetBrains Mono, monospace" }}>Redirecting you to home…</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl z-50"
          style={{
            background: toast.ok ? "rgba(240,255,248,0.97)" : "rgba(255,240,240,0.97)",
            border: toast.ok ? "1px solid rgba(0,170,85,0.28)" : "1px solid rgba(204,0,0,0.28)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(59,42,35,0.15)",
            whiteSpace: "nowrap",
          }}
        >
          {toast.ok ? <CheckCircle size={14} style={{ color: "#00aa55", flexShrink: 0 }} /> : <AlertCircle size={14} style={{ color: "#cc0000", flexShrink: 0 }} />}
          <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", color: toast.ok ? "#00aa55" : "#cc0000" }}>
            {toast.msg}
          </span>
        </div>
      )}
    </div>
  );
}
