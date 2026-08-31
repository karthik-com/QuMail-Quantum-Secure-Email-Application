import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Bell,
  Settings as SettingsIcon,
  Send,
  Paperclip,
  Save,
  Trash2,
  Shield,
  Lock,
  Users,
  X,
} from "lucide-react";
import { ProfileDropdown } from "../components/ProfileDropdown";

const inputStyle = {
  background: "#FFFDF9",
  border: "1px solid #DCCFC0",
  color: "#3B2A23",
  outline: "none",
};

const labelStyle = {
  fontFamily: "JetBrains Mono, monospace",
  color: "#A89B91",
};

export default function Compose() {
  const navigate = useNavigate();

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [quantumEncryption, setQuantumEncryption] = useState(true);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const handleSend = async () => {
    if (!quantumEncryption) {
      setNotification({ message: "Enable quantum encryption to send mail", type: "info" });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("access");
      const formData = new FormData();
      formData.append("receivers", to);
      formData.append("subject", subject);
      formData.append("message", body);
      if (attachment) formData.append("attachment", attachment);

      const response = await fetch("http://127.0.0.1:8000/sendMail/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to send mail");
        return;
      }

      setNotification({ message: "Secure mail sent successfully", type: "success" });
      setTimeout(() => {
        setNotification(null);
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.log(error);
      setNotification({ message: "Server error occurred", type: "info" });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://127.0.0.1:8000/saveDraft/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receivers: to, subject, message: body }),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotification({ message: "Server error occurred", type: "info" });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      setNotification({ message: "Message saved as draft", type: "success" });
      setTimeout(() => {
        setNotification(null);
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  const handleDiscard = () => setShowDiscardDialog(true);
  const confirmDiscard = () => { setShowDiscardDialog(false); navigate("/dashboard"); };
  const cancelDiscard = () => setShowDiscardDialog(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#FAF3E7" }}>

      {/* Top Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
        style={{
          background: "rgba(59,42,35,0.92)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          borderBottom: "1px solid rgba(184,155,94,0.18)",
          boxShadow: "0 4px 40px rgba(59,42,35,0.12)",
        }}
      >
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 no-underline">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(184,155,94,0.18)", border: "1px solid rgba(184,155,94,0.45)" }}
          >
            <span className="font-black text-base" style={{ fontFamily: "Orbitron, sans-serif", color: "#B89B5E" }}>Q</span>
          </div>
          <span className="text-lg font-bold tracking-widest" style={{ fontFamily: "Orbitron, sans-serif", color: "#FAF3E7" }}>
            Qumail
          </span>
        </Link>

        <div className="hidden md:flex flex-1 justify-center px-4">
          <span className="text-xs tracking-widest uppercase" style={{ fontFamily: "JetBrains Mono, monospace", color: "rgba(250,243,231,0.45)" }}>
            Quantum Secure Email Communication
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(184,155,94,0.12)", border: "1px solid rgba(184,155,94,0.28)", color: "#B89B5E" }}
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(184,155,94,0.12)", border: "1px solid rgba(184,155,94,0.28)", color: "#B89B5E" }}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <ProfileDropdown isDark={false} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto hide-scrollbar pt-16">
        <div className="max-w-5xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#3B2A23" }}>
              Compose Message
            </h1>
            <p className="text-sm" style={{ color: "#7A6D63" }}>
              Send a quantum-encrypted email securely.
            </p>
          </div>

          {/* Compose Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#FFFDF9",
              border: "1px solid #E6DDD2",
              boxShadow: "0 24px 80px rgba(59,42,35,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            {/* Card Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E6DDD2" }}>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: "#B89B5E" }} />
                <h2 className="text-lg font-bold" style={{ fontFamily: "Orbitron, sans-serif", color: "#3B2A23" }}>
                  New Message
                </h2>
              </div>
              <button
                onClick={handleDiscard}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{ background: "rgba(204,0,0,0.08)", border: "1px solid rgba(204,0,0,0.2)", color: "#cc0000" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* To Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs tracking-wider uppercase" style={labelStyle}>To</label>
                  <div className="flex gap-2">
                    {!showCc && (
                      <button onClick={() => setShowCc(true)} className="text-xs hover:underline" style={{ color: "#B89B5E" }}>Cc</button>
                    )}
                    {!showBcc && (
                      <button onClick={() => setShowBcc(true)} className="text-xs hover:underline" style={{ color: "#B89B5E" }}>Bcc</button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#A89B91" }}>
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="recipient@qumail.io"
                    className="w-full rounded-xl text-sm transition-all duration-200 pl-10 pr-4 py-2.5"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "#B89B5E")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#DCCFC0")}
                  />
                </div>
              </div>

              {/* Cc Field */}
              {showCc && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs tracking-wider uppercase" style={labelStyle}>Cc</label>
                    <button onClick={() => setShowCc(false)} className="text-xs hover:underline" style={{ color: "#cc0000" }}>Remove</button>
                  </div>
                  <input
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@qumail.io"
                    className="w-full rounded-xl text-sm transition-all duration-200 px-4 py-2.5"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "#B89B5E")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#DCCFC0")}
                  />
                </div>
              )}

              {/* Bcc Field */}
              {showBcc && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs tracking-wider uppercase" style={labelStyle}>Bcc</label>
                    <button onClick={() => setShowBcc(false)} className="text-xs hover:underline" style={{ color: "#cc0000" }}>Remove</button>
                  </div>
                  <input
                    type="email"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@qumail.io"
                    className="w-full rounded-xl text-sm transition-all duration-200 px-4 py-2.5"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "#B89B5E")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#DCCFC0")}
                  />
                </div>
              )}

              {/* Subject Field */}
              <div className="space-y-1.5">
                <label className="block text-xs tracking-wider uppercase" style={labelStyle}>Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full rounded-xl text-sm transition-all duration-200 px-4 py-2.5"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#B89B5E")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#DCCFC0")}
                />
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <label className="block text-xs tracking-wider uppercase" style={labelStyle}>Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Compose your quantum-encrypted message..."
                  rows={12}
                  className="w-full rounded-xl text-sm transition-all duration-200 px-4 py-3 resize-none"
                  style={{ ...inputStyle, lineHeight: "1.6" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#B89B5E")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#DCCFC0")}
                />
              </div>

              {/* Quantum Encryption Toggle */}
              <div
                className="rounded-xl p-4 flex items-center justify-between"
                style={{
                  background: "rgba(184,155,94,0.07)",
                  border: "1px solid rgba(184,155,94,0.25)",
                }}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5" style={{ color: "#B89B5E" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#3B2A23" }}>Quantum Encryption</p>
                    <p className="text-xs" style={{ color: "#7A6D63", fontFamily: "JetBrains Mono, monospace" }}>
                      End-to-end post-quantum cryptography enabled
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setQuantumEncryption(!quantumEncryption)}
                  className="relative w-12 h-6 rounded-full transition-all duration-300"
                  style={{
                    background: quantumEncryption ? "#B89B5E" : "rgba(59,42,35,0.15)",
                    border: quantumEncryption ? "1px solid rgba(184,155,94,0.5)" : "1px solid #DCCFC0",
                    boxShadow: quantumEncryption ? "0 0 15px rgba(184,155,94,0.3)" : "none",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
                    style={{
                      left: quantumEncryption ? "calc(100% - 22px)" : "2px",
                      background: "#ffffff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSend}
                  className="flex-1 py-3 rounded-xl font-semibold tracking-widest uppercase transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{
                    background: "#B89B5E",
                    color: "#FAF3E7",
                    boxShadow: "0 4px 22px rgba(184,155,94,0.35)",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.18em",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#A6874E")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#B89B5E")}
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>

                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-3 rounded-xl font-semibold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] flex items-center gap-2"
                  style={{
                    background: "rgba(184,155,94,0.1)",
                    border: "1px solid rgba(184,155,94,0.3)",
                    color: "#B89B5E",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.18em",
                  }}
                >
                  <Save className="w-4 h-4" />
                  Draft
                </button>

                <label
                  className="px-6 py-3 rounded-xl font-semibold tracking-widest uppercase transition-all duration-200 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                  style={{
                    background: "rgba(184,155,94,0.1)",
                    border: "1px solid rgba(184,155,94,0.3)",
                    color: "#B89B5E",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.18em",
                  }}
                >
                  <Paperclip className="w-4 h-4" />
                  {attachment ? attachment.name : "Attach"}
                  <input
                    type="file"
                    hidden
                    onChange={(e) => { if (e.target.files?.[0]) setAttachment(e.target.files[0]); }}
                  />
                </label>
              </div>
            </div>

            {/* Footer Security Badge */}
            <div
              className="px-6 py-3 flex items-center gap-2 justify-center"
              style={{ borderTop: "1px solid #E6DDD2", background: "rgba(184,155,94,0.025)" }}
            >
              <Shield className="w-3 h-3" style={{ color: "#A89B91", opacity: 0.6 }} />
              <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#A89B91" }}>
                TLS 1.3 · CRYSTALS-Kyber · CRYSTALS-Dilithium
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4" style={{ borderTop: "1px solid #E6DDD2" }}>
        <p className="text-center text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#A89B91" }}>
          &copy; Qumail Application 2026
        </p>
      </footer>

      {/* Notification Toast */}
      {notification && (
        <div
          className="fixed bottom-6 right-6 rounded-xl px-6 py-4 flex items-center gap-3 shadow-2xl transition-all duration-300"
          style={{
            background: notification.type === "success"
              ? "rgba(184,155,94,0.12)"
              : "rgba(59,42,35,0.08)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: notification.type === "success"
              ? "1px solid rgba(184,155,94,0.4)"
              : "1px solid #E6DDD2",
            boxShadow: "0 8px 32px rgba(59,42,35,0.12)",
            zIndex: 1000,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: notification.type === "success" ? "#B89B5E" : "#7A6D63",
              boxShadow: notification.type === "success" ? "0 0 8px rgba(184,155,94,0.6)" : "none",
            }}
          />
          <p className="text-sm font-medium" style={{ color: "#3B2A23", fontFamily: "JetBrains Mono, monospace" }}>
            {notification.message}
          </p>
        </div>
      )}

      {/* Discard Confirmation Dialog */}
      {showDiscardDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            background: "rgba(59,42,35,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1001,
          }}
          onClick={cancelDiscard}
        >
          <div
            className="rounded-2xl overflow-hidden w-full max-w-md mx-4"
            style={{
              background: "#FFFDF9",
              border: "1px solid #E6DDD2",
              boxShadow: "0 24px 80px rgba(59,42,35,0.18), inset 0 1px 0 rgba(255,255,255,1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(204,0,0,0.1)" }}>
                  <Trash2 className="w-5 h-5" style={{ color: "#cc0000" }} />
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "Orbitron, sans-serif", color: "#3B2A23" }}>
                  Discard Message?
                </h3>
              </div>
              <p className="text-sm mb-6" style={{ color: "#7A6D63", lineHeight: "1.6" }}>
                Are you sure you want to discard this message? This action cannot be undone and all your changes will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDiscard}
                  className="flex-1 py-2.5 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "rgba(184,155,94,0.1)",
                    border: "1px solid rgba(184,155,94,0.3)",
                    color: "#B89B5E",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDiscard}
                  className="flex-1 py-2.5 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #cc0000, #990000)",
                    color: "#ffffff",
                    boxShadow: "0 4px 22px rgba(204,0,0,0.3)",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                  }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
