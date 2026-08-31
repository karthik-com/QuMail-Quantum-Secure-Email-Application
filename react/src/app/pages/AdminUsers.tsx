import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  KeyRound,
  Copy,
  Check,
  Send,
  Clock,
  Monitor,
  LogIn,
  LogOut,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronRight,
  Smartphone,
  Globe,
  RefreshCw,
} from "lucide-react";

// ── Types (unchanged from backend) ────────────────────────────────────────────
interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_locked: boolean;
  must_change_password: boolean;
  created_at: string;
}

interface Activity {
  id: string;
  ip_address: string;
  device: string;
  login_time: string;
  logout_time: string | null;
  is_active: boolean;
  status: string;
}



// ── Visual helpers ────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_PALETTE = [
  { bg: "linear-gradient(135deg,#B89B5E,#A6874E)", color: "#FAF3E7" },
  { bg: "linear-gradient(135deg,#3B2A23,#6B4232)", color: "#B89B5E" },
  { bg: "linear-gradient(135deg,#5B4535,#8B6545)", color: "#FAF3E7" },
  { bg: "linear-gradient(135deg,#6B5B4E,#9B8B7E)", color: "#FAF3E7" },
  { bg: "linear-gradient(135deg,#2A3B35,#3E6B5A)", color: "#A8DBC8" },
];
const pal = (index: number) => AVATAR_PALETTE[index % AVATAR_PALETTE.length];

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#FFFDF9",
        border: "1px solid #E6DDD2",
        boxShadow: "0 2px 16px rgba(59,42,35,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{
        borderBottom: "1px solid #E6DDD2",
        background: "rgba(184,155,94,0.03)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: "#B89B5E" }}>{icon}</span>
        <span
          style={{
            fontFamily: "Orbitron, sans-serif",
            color: "#3B2A23",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </span>
      </div>
      {right}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: "#FAF3E7", border: "1px solid #E6DDD2" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: "#B89B5E" }}>{icon}</span>
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.58rem",
            color: "#A89B91",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.82rem",
          color: "#3B2A23",
          fontWeight: 600,
          wordBreak: "break-all",
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UserProfile() {
  const navigate = useNavigate();

  // ── States (all original, untouched) ────────────────────────────────────
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordExpiry, setPasswordExpiry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ── API Base (original) ──────────────────────────────────────────────────
  const API_BASE = "http://127.0.0.1:8000";

  // ── Get Token (original) ─────────────────────────────────────────────────
  const getToken = () =>
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    "";

  // ── Load Users (original) ────────────────────────────────────────────────
  const loadUsers = async () => {
    setLoadingUsers(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/adminusers/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data);
    } catch (err: any) {
      console.error("Load users error:", err);
      setError(err.message || "Unable to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ── Select User (original) ────────────────────────────────────────────────
  const handleSelectUser = async (user: UserData) => {
    setSelectedUser(user);
    setGeneratedPassword("");
    setPasswordExpiry("");
    setShowPassword(false);
    setCopied(false);
    setMessage("");
    setError("");
    await loadActivity(user.id);
  };

  // ── Load Activity (original) ──────────────────────────────────────────────
  const loadActivity = async (userId: string) => {
    setLoadingActivity(true);
    try {
      const response = await fetch(
        `${API_BASE}/adminuser-activity/${userId}/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to load activity");
      setActivities(data);
    } catch (err: any) {
      console.error("Activity error:", err);
      setActivities([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  // ── Generate Password (original) ──────────────────────────────────────────
  const handleGeneratePassword = async () => {
    if (!selectedUser) return;
    setGeneratingPassword(true);
    setMessage("");
    setError("");
    setGeneratedPassword("");
    try {
      const response = await fetch(
        `${API_BASE}/admingenerate-temp-password/${selectedUser.id}/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to generate password");
      setGeneratedPassword(data.temporary_password);
      setPasswordExpiry(data.expires_at || "5 minutes");
      setShowPassword(true);
      setCopied(false);
      setMessage("Temporary password generated and SMS sent successfully.");
      setSelectedUser((prev) => {
        if (!prev) return prev;
        return { ...prev, is_locked: false, must_change_password: true };
      });
      loadUsers();
    } catch (err: any) {
      console.error("Generate password error:", err);
      setError(err.message || "Unable to generate password");
    } finally {
      setGeneratingPassword(false);
    }
  };

  // ── Copy Password (original) ──────────────────────────────────────────────
  const handleCopy = async () => {
    if (!generatedPassword) return;
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  // ── Send Message (original) ───────────────────────────────────────────────
  const handleSendMessage = () => {
    if (!selectedUser) return;
    if (!generatedPassword) {
      setError("Generate a temporary password first.");
      return;
    }
    /*
     * The actual SMS is already sent by Django through AWS SNS
     * when the password is generated. This button is for UI flow.
     * Will connect to a separate send-message API later if required.
     */
    setMessage(`Message already sent to ${selectedUser.phone}.`);
  };

  // ── Loading Screen ────────────────────────────────────────────────────────
  if (loadingUsers) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: "#FAF3E7" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(184,155,94,0.12)", border: "1px solid rgba(184,155,94,0.28)" }}
        >
          <RefreshCw size={20} style={{ color: "#B89B5E" }} className="animate-spin" />
        </div>
        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: "#7A6D63" }}>
          Loading registered users…
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAF3E7" }}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
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
          onClick={() => {
            if (selectedUser) { setSelectedUser(null); return; }
            navigate("/admin-dashboard");
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 flex-shrink-0"
          style={{
            background: "rgba(184,155,94,0.15)",
            border: "1px solid rgba(184,155,94,0.35)",
            color: "#B89B5E",
          }}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="truncate"
            style={{
              fontFamily: "Orbitron, sans-serif",
              color: "#FAF3E7",
              fontSize: "0.92rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            {selectedUser ? selectedUser.name : "User Profiles"}
          </p>
          <p style={{ fontSize: "0.61rem", color: "rgba(250,243,231,0.5)", fontFamily: "JetBrains Mono, monospace" }}>
            {selectedUser ? selectedUser.email : `${users.length} registered users · Admin View`}
          </p>
        </div>

        {/* Status pill in header when user is selected */}
        {selectedUser && (
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
            style={{
              background: selectedUser.is_locked
                ? "rgba(204,0,0,0.15)"
                : "rgba(0,170,85,0.15)",
              border: `1px solid ${selectedUser.is_locked ? "rgba(204,0,0,0.3)" : "rgba(0,170,85,0.3)"}`,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: selectedUser.is_locked ? "#cc0000" : "#00aa55",
                display: "inline-block",
                boxShadow: `0 0 5px ${selectedUser.is_locked ? "#cc000099" : "#00aa5599"}`,
              }}
            />
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "0.54rem",
                color: selectedUser.is_locked ? "#ff9d9d" : "#7dffb3",
                fontWeight: 700,
                letterSpacing: "0.07em",
              }}
            >
              {selectedUser.is_locked ? "LOCKED" : "ACTIVE"}
            </span>
          </span>
        )}

        {!selectedUser && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(184,155,94,0.12)", border: "1px solid rgba(184,155,94,0.28)" }}
          >
            <Shield size={11} style={{ color: "#B89B5E" }} />
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.54rem", color: "#B89B5E", fontWeight: 700, letterSpacing: "0.07em" }}>
              ADMIN
            </span>
          </div>
        )}
      </header>

      {/* ── Global Banners ────────────────────────────────────────────────── */}
      {(error || message) && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-4 space-y-2">
          {error && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
              style={{
                background: "rgba(204,0,0,0.06)",
                border: "1px solid rgba(204,0,0,0.2)",
                color: "#cc0000",
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem" }}>
                {error}
              </span>
            </div>
          )}
          {message && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
              style={{
                background: "rgba(0,170,85,0.07)",
                border: "1px solid rgba(0,170,85,0.22)",
                color: "#008844",
              }}
            >
              <Check size={14} style={{ flexShrink: 0 }} />
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem" }}>
                {message}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-5 pb-14">

          {/* Page intro (list view only) */}
          {!selectedUser && (
            <div className="mb-5">
              <p style={{ fontFamily: "Orbitron, sans-serif", color: "#3B2A23", fontSize: "1.1rem", fontWeight: 800, letterSpacing: "0.04em", marginBottom: 4 }}>
                User Profiles
              </p>
              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem", color: "#7A6D63" }}>
                Manage registered Qumail users
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Left Panel: User List ──────────────────────────────────── */}
            <SectionCard>
              <SectionHeader
                icon={<User size={13} />}
                title="ALL USERS"
                right={
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontFamily: "Orbitron, sans-serif",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      color: "#B89B5E",
                      background: "rgba(184,155,94,0.1)",
                    }}
                  >
                    {users.length}
                  </span>
                }
              />

              <div className="max-h-[600px] overflow-y-auto">
                {users.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3 px-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(184,155,94,0.1)", border: "1px solid rgba(184,155,94,0.2)" }}
                    >
                      <User size={20} style={{ color: "#B89B5E" }} />
                    </div>
                    <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", color: "#A89B91", textAlign: "center" }}>
                      No registered users found.
                    </p>
                  </div>
                ) : (
                  users.map((user, index) => {
                    const p = pal(index);
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full text-left px-4 py-3.5 transition-all duration-200 group"
                        style={{
                          background: isSelected
                            ? "rgba(184,155,94,0.10)"
                            : "transparent",
                          borderBottom: "1px solid #EEE5DB",
                          borderLeft: isSelected
                            ? "3px solid #B89B5E"
                            : "3px solid transparent",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: p.bg,
                              color: p.color,
                              fontFamily: "Orbitron, sans-serif",
                              fontSize: "0.6rem",
                              fontWeight: 800,
                            }}
                          >
                            {initials(user.name)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="truncate"
                              style={{
                                fontFamily: "Orbitron, sans-serif",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "#3B2A23",
                                marginBottom: 2,
                              }}
                            >
                              {user.name}
                            </p>
                            <p
                              className="truncate"
                              style={{
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: "0.62rem",
                                color: "#7A6D63",
                                marginBottom: 4,
                              }}
                            >
                              {user.email}
                            </p>
                            <span
                              className="inline-flex items-center gap-1"
                              style={{
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: "0.54rem",
                                fontWeight: 700,
                                color: user.is_locked ? "#cc0000" : "#00aa55",
                              }}
                            >
                              <span
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  background: user.is_locked ? "#cc0000" : "#00aa55",
                                  display: "inline-block",
                                }}
                              />
                              {user.is_locked ? "Locked" : "Active"}
                            </span>
                          </div>

                          <ChevronRight
                            size={13}
                            style={{ color: "#B89B5E", flexShrink: 0 }}
                            className="group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </SectionCard>

            {/* ── Right Panel: User Details ──────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">

              {!selectedUser ? (
                /* Empty state */
                <div
                  className="h-full min-h-[400px] rounded-2xl flex flex-col items-center justify-center gap-3"
                  style={{ background: "#FFFDF9", border: "1px solid #E6DDD2" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(184,155,94,0.1)", border: "1px solid rgba(184,155,94,0.2)" }}
                  >
                    <User size={26} style={{ color: "#B89B5E" }} />
                  </div>
                  <p style={{ fontFamily: "Orbitron, sans-serif", color: "#3B2A23", fontSize: "0.85rem", fontWeight: 700 }}>
                    Select a User
                  </p>
                  <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", color: "#A89B91" }}>
                    Choose a registered user from the list to view their profile.
                  </p>
                </div>

              ) : (
                <>
                  {/* ── Profile Card ──────────────────────────────────────── */}
                  <SectionCard>
                    {/* Profile header banner */}
                    <div
                      className="px-5 py-5 flex items-center gap-4"
                      style={{
                        background: "linear-gradient(135deg,rgba(59,42,35,0.04),rgba(184,155,94,0.07))",
                        borderBottom: "1px solid #E6DDD2",
                      }}
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "#F3E9D2",
                          color: "#3B2A23",
                          fontFamily: "Orbitron, sans-serif",
                          fontSize: "1.1rem",
                          fontWeight: 800,
                          boxShadow: "0 6px 20px rgba(59,42,35,0.18)",
                        }}
                      >
                        {initials(selectedUser.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontFamily: "Orbitron, sans-serif",
                            color: "#3B2A23",
                            fontSize: "1rem",
                            fontWeight: 800,
                            marginBottom: 4,
                          }}
                        >
                          {selectedUser.name}
                        </p>
                        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", color: "#7A6D63", marginBottom: 8 }}>
                          {selectedUser.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{
                              background: selectedUser.is_locked
                                ? "rgba(204,0,0,0.08)"
                                : "rgba(0,170,85,0.09)",
                              border: `1px solid ${selectedUser.is_locked ? "rgba(204,0,0,0.2)" : "rgba(0,170,85,0.2)"}`,
                              color: selectedUser.is_locked ? "#cc0000" : "#00aa55",
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "0.58rem",
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: selectedUser.is_locked ? "#cc0000" : "#00aa55",
                                display: "inline-block",
                                boxShadow: `0 0 5px ${selectedUser.is_locked ? "#cc000088" : "#00aa5588"}`,
                              }}
                            />
                            {selectedUser.is_locked ? "Account Locked" : "Account Active"}
                          </span>
                          {selectedUser.must_change_password && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full"
                              style={{
                                background: "rgba(232,168,56,0.08)",
                                border: "1px solid rgba(232,168,56,0.25)",
                                color: "#E8A838",
                                fontFamily: "JetBrains Mono, monospace",
                                fontSize: "0.58rem",
                                fontWeight: 700,
                              }}
                            >
                              <Lock size={9} />
                              Password Reset Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Info tiles */}
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <InfoTile icon={<User size={13} />} label="Full Name" value={selectedUser.name} />
                      <InfoTile icon={<Mail size={13} />} label="Email" value={selectedUser.email} />
                      <InfoTile icon={<Phone size={13} />} label="Phone" value={selectedUser.phone || "Not available"} />
                    </div>
                  </SectionCard>

                  {/* ── Temporary Password Section ─────────────────────── */}
                  <SectionCard>
                    <SectionHeader icon={<KeyRound size={13} />} title="TEMPORARY PASSWORD" />

                    <div className="px-5 py-5 space-y-4">
                      {/* Warning notice */}
                      <div
                        className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl"
                        style={{
                          background: "rgba(232,168,56,0.06)",
                          border: "1px solid rgba(232,168,56,0.22)",
                        }}
                      >
                        <AlertCircle size={13} style={{ color: "#E8A838", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.64rem", color: "#7A6D63", lineHeight: 1.6 }}>
                          Generating a temporary password will immediately unlock the account and send
                          the password via SMS to the user's registered phone number through AWS SNS.
                          The password is valid for 5 minutes.
                        </p>
                      </div>

                      {/* Generate button */}
                      <button
                        onClick={handleGeneratePassword}
                        disabled={generatingPassword}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: generatingPassword
                            ? "rgba(184,155,94,0.3)"
                            : "linear-gradient(135deg,#B89B5E,#A6874E)",
                          color: "#FAF3E7",
                          fontFamily: "Orbitron, sans-serif",
                          fontSize: "0.62rem",
                          letterSpacing: "0.08em",
                          fontWeight: 700,
                          boxShadow: generatingPassword
                            ? "none"
                            : "0 4px 14px rgba(184,155,94,0.28)",
                        }}
                      >
                        <KeyRound size={13} />
                        {generatingPassword ? "GENERATING…" : "GENERATE NEW PASSWORD"}
                      </button>

                      {/* Generated password display */}
                      {generatedPassword && (
                        <div
                          className="rounded-xl overflow-hidden"
                          style={{
                            background: "rgba(184,155,94,0.06)",
                            border: "1px solid rgba(184,155,94,0.28)",
                          }}
                        >
                          {/* Password row */}
                          <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(184,155,94,0.15)" }}>
                            <div className="flex-1 min-w-0">
                              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.56rem", color: "#A89B91", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                                Temporary Password
                              </p>
                              <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.88rem", fontWeight: 700, color: "#3B2A23", letterSpacing: showPassword ? "0.04em" : "0.1em", wordBreak: "break-all" }}>
                                {showPassword ? generatedPassword : "••••••••••••••••"}
                              </p>
                            </div>

                            {/* Show/hide */}
                            <button
                              onClick={() => setShowPassword(!showPassword)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 flex-shrink-0"
                              style={{ background: "#FFFDF9", border: "1px solid #DCCFC0", color: "#7A6D63" }}
                              title={showPassword ? "Hide" : "Show"}
                            >
                              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>

                            {/* Copy */}
                            <button
                              onClick={handleCopy}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-110 flex-shrink-0"
                              style={{
                                background: copied ? "rgba(0,170,85,0.1)" : "#FFFDF9",
                                border: copied ? "1px solid rgba(0,170,85,0.25)" : "1px solid #DCCFC0",
                                color: copied ? "#00aa55" : "#B89B5E",
                              }}
                              title="Copy password"
                            >
                              {copied ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>

                          {/* Expiry row */}
                          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid rgba(184,155,94,0.12)" }}>
                            <Clock size={12} style={{ color: "#B89B5E", flexShrink: 0 }} />
                            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.64rem", color: "#7A6D63" }}>
                              Valid for 5 minutes
                              {passwordExpiry && ` · Expires ${passwordExpiry}`}
                            </span>
                          </div>

                          {/* Send message */}
                          <div className="px-4 py-3.5">
                            <button
                              onClick={handleSendMessage}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                              style={{
                                background: "#3B2A23",
                                color: "#FAF3E7",
                                fontFamily: "Orbitron, sans-serif",
                                fontSize: "0.62rem",
                                letterSpacing: "0.08em",
                                fontWeight: 700,
                              }}
                            >
                              <Send size={13} />
                              SEND MESSAGE
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  {/* ── Account Activity Section ───────────────────────── */}
                  <SectionCard>
                    <SectionHeader icon={<Shield size={13} />} title="ACCOUNT ACTIVITY" />

                    <div className="px-5 py-5">
                      {loadingActivity ? (
                        <div className="flex items-center gap-2.5 py-6 justify-center">
                          <RefreshCw size={14} style={{ color: "#B89B5E" }} className="animate-spin" />
                          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", color: "#A89B91" }}>
                            Loading activity…
                          </p>
                        </div>

                      ) : activities.length === 0 ? (
                        <div className="flex flex-col items-center py-10 gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: "rgba(184,155,94,0.1)", border: "1px solid rgba(184,155,94,0.2)" }}
                          >
                            <Monitor size={20} style={{ color: "#B89B5E" }} />
                          </div>
                          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", color: "#A89B91" }}>
                            No account activity found.
                          </p>
                        </div>

                      ) : (
                        <div className="space-y-2.5">
                          {activities.map((activity) => {
                            const isOk = activity.status === "SUCCESS";
                            return (
                              <div
                                key={activity.id}
                                className="rounded-xl overflow-hidden"
                                style={{
                                  background: isOk
                                    ? "rgba(0,170,85,0.04)"
                                    : "rgba(204,0,0,0.04)",
                                  border: `1px solid ${isOk ? "rgba(0,170,85,0.15)" : "rgba(204,0,0,0.15)"}`,
                                }}
                              >
                                {/* Top row: status + time + badge */}
                                <div
                                  className="flex items-center justify-between gap-3 px-4 py-3"
                                  style={{ borderBottom: `1px solid ${isOk ? "rgba(0,170,85,0.1)" : "rgba(204,0,0,0.1)"}` }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    {isOk ? (
                                      <LogIn size={14} style={{ color: "#00aa55", flexShrink: 0 }} />
                                    ) : (
                                      <AlertCircle size={14} style={{ color: "#cc0000", flexShrink: 0 }} />
                                    )}
                                    <div>
                                      <p style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.68rem", fontWeight: 700, color: "#3B2A23" }}>
                                        {isOk ? "Login" : "Failed Login"}
                                      </p>
                                      <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: "#A89B91", marginTop: 1 }}>
                                        {activity.login_time}
                                      </p>
                                    </div>
                                  </div>

                                  <span
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                                    style={{
                                      background: isOk
                                        ? "rgba(0,170,85,0.1)"
                                        : "rgba(204,0,0,0.1)",
                                      border: `1px solid ${isOk ? "rgba(0,170,85,0.22)" : "rgba(204,0,0,0.22)"}`,
                                      color: isOk ? "#00aa55" : "#cc0000",
                                      fontFamily: "JetBrains Mono, monospace",
                                      fontSize: "0.54rem",
                                      fontWeight: 700,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: isOk ? "#00aa55" : "#cc0000",
                                        display: "inline-block",
                                      }}
                                    />
                                    {activity.status}
                                  </span>
                                </div>

                                {/* Bottom row: IP + device + logout */}
                                <div
                                  className="grid gap-x-4 gap-y-1 px-4 py-2.5"
                                  style={{
                                    gridTemplateColumns: "1fr 1fr",
                                    fontFamily: "JetBrains Mono, monospace",
                                    fontSize: "0.62rem",
                                    color: "#7A6D63",
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Globe size={10} style={{ color: "#B89B5E", flexShrink: 0 }} />
                                    <span>IP: {activity.ip_address}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Monitor size={10} style={{ color: "#B89B5E", flexShrink: 0 }} />
                                    <span className="truncate">Device: {activity.device}</span>
                                  </div>
                                  {activity.logout_time && (
                                    <div className="flex items-center gap-1.5 col-span-2">
                                      <LogOut size={10} style={{ color: "#A89B91", flexShrink: 0 }} />
                                      <span>Logout: {activity.logout_time}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </SectionCard>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
