import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router";
import {
  Send, FileText, Trash2, AlertOctagon, Star, Edit,
  Inbox, Reply, Forward,
  Download, Paperclip, Shield,
  Lock, CheckCircle, ArrowLeft, FileIcon,
} from "lucide-react";
import { ProfileDropdown } from "../components/ProfileDropdown";

type MailFolder = "inbox" | "sent" | "drafts" | "trash" | "starred";

const warmCard = {
  background: "#FFFDF9",
  border: "1px solid #E6DDD2",
  boxShadow: "0 24px 80px rgba(59,42,35,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
} as React.CSSProperties;

const goldBtn = {
  background: "rgba(184,155,94,0.1)",
  border: "1px solid rgba(184,155,94,0.28)",
  color: "#B89B5E",
} as React.CSSProperties;

export default function ReadEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const folder = location.state?.folder;
  const showReplyButton = folder === "inbox";
  const { id } = useParams();

  const draft = location.state?.draft;

  const trashMailType = location.state?.mailType;
  const trashSender = location.state?.sender;
  const trashRecipient = location.state?.recipient;

  const [activeFolder, setActiveFolder] = useState<MailFolder>(location.state?.folder || "inbox");
  const [isStarred, setIsStarred] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showSectionMessage, setShowSectionMessage] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardSearch, setForwardSearch] = useState("");
  const [users, setUsers] = useState<{ username: string }[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showForwardNotification, setShowForwardNotification] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(true);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [mailData, setMailData] = useState<any>(draft || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const handleToggleStar = async () => {
  try {
    const token = localStorage.getItem("access");

    const response = await fetch(
      `http://127.0.0.1:8000/toggle-star/${id}/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      setIsStarred(data.is_starred);
    } else {
      alert(data.error || "Unable to update star");
    }

  } catch (error) {
    console.error("Error toggling star:", error);
  }
};

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    // Drafts are already available locally and do not need OTP or decryption.
    if (draft) {
      setMailData(draft);
      setShowOtpDialog(false);
      setOtpVerified(true);
      return;
    }

    const sendOtp = async () => {
      try {
        const token = localStorage.getItem("access");
        await fetch(`http://127.0.0.1:8000/send-otp/${id}/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.log(error);
      }
    };
    sendOtp();
  }, [draft, id]);

  useEffect(() => {
    if (mailData?.message) {
      setEditedMessage(mailData.message);
    }
  }, [mailData]);

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      alert("Please enter the 6-character OTP.");
      return;
    }

    if (!/^[a-z0-9]{6}$/.test(enteredOtp)) {
      alert("OTP must contain only lowercase letters and numbers.");
      return;
    }

    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://127.0.0.1:8000/verify-otp/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp: enteredOtp }),
      });
      const data = await response.json();
      if (response.ok) {
        setOtpVerified(true);
        const mailResponse = await fetch(`http://127.0.0.1:8000/decrypt-mail/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mail = await mailResponse.json();
        console.log("decrypt-mail response:", mail);
        setMailData(mail);
        setIsStarred(mail.is_starred);
        setIsDecrypting(true);
        let progress = 0;
        const interval = setInterval(() => {
          progress += 1;
          setDecryptProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => setShowOtpDialog(false), 500);
          }
        }, 20);
      } else {
        alert(data.error || data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.toLowerCase();

    if (!/^[a-z0-9]?$/.test(cleanValue)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = cleanValue;
    setOtp(updatedOtp);
    if (cleanValue && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      const token = localStorage.getItem("access");
      await fetch(`http://127.0.0.1:8000/send-otp/${id}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCountdown(45);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCancelOtp = () => navigate("/dashboard");

  const handleDeleteMail = async () => {
    try {
      console.log("Mail ID:",id);
      const token = localStorage.getItem("access");
      const response = await fetch(`http://127.0.0.1:8000/delete-mail/${id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      console.log(response);
      if (response.ok) navigate("/dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  const cancelDelete = () => setShowDeleteDialog(false);

  const handleReplyScroll = () => {
    document.getElementById("reply-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendReply = async () => {
    try {
      const token = localStorage.getItem("access");
      const formData = new FormData();
      formData.append("message", replyMessage);
      if (replyAttachment) formData.append("attachment", replyAttachment);
      const response = await fetch(`http://127.0.0.1:8000/reply-mail/${id}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setShowNotification(true);
        setReplyMessage("");
        setTimeout(() => { setShowNotification(false); navigate("/dashboard"); }, 2000);
      } else {
        alert(data.error || data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://127.0.0.1:8000/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) { console.error("Failed to fetch users", response.status); return; }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleForwardSend = async () => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://127.0.0.1:8000/forward/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mail_id: id, receivers: selectedRecipients }),
      });
      if (response.ok) {
        setShowForwardDialog(false);
        setShowForwardNotification(true);
        setTimeout(() => { setShowForwardNotification(false); navigate("/dashboard"); }, 2000);
      } else {
        const data = await response.json();
        alert(data.error || data.message || "Failed to forward email.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestoreMail = async () => {
  try {
    const token = localStorage.getItem("access");

    const response = await fetch(
      `http://127.0.0.1:8000/restore-mail/${id}/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      setNotificationMessage("Email Restored Successfully");
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
        navigate("/dashboard");
      }, 1500);
    } else {
      alert(data.error || "Failed to restore email.");
    }
  } catch (error) {
    console.error("RESTORE ERROR:", error);
  }
};


const handlePermanentDelete = async () => {
  try {
    const token = localStorage.getItem("access");

    const response = await fetch(
      `http://127.0.0.1:8000/delete-permanently/${id}/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      setNotificationMessage("Email Deleted Permanently");
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
        navigate("/dashboard");
      }, 1500);
    } else {
      alert(data.error || "Failed to permanently delete email.");
    }
  } catch (error) {
    console.error("PERMANENT DELETE ERROR:", error);
  }
};

  const handleSendDraft = async () => {
    try {
      const token = localStorage.getItem("access");

      const response = await fetch(
        `http://127.0.0.1:8000/send-draft/${mailData?.id}/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to send draft");
        return;
      }

      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);

        navigate("/dashboard", {
          state: {
            folder: "sent",
          },
        });
      }, 1800);
    } catch (error) {
      console.error("SEND DRAFT ERROR:", error);
      alert("Server error while sending draft");
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);

      const token = localStorage.getItem("access");
      const response = await fetch(
        `http://127.0.0.1:8000/edit/${mailData?.id || id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject: mailData?.subject,
            message: editedMessage,
          }),
        }
      );

      const data = await response.json();

      console.log("DECRYPT MAIL DATA:", data);
      console.log("IS STARRED:", data.is_starred);

      setMailData(data);
      setIsStarred(data.is_starred);

      if (!response.ok) {
        alert(data.error || "Unable to update mail");
        return;
      }

      setMailData({
        ...mailData,
        message: editedMessage,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("EDIT MAIL ERROR:", error);
      alert("Server error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(forwardSearch.toLowerCase())
  );

  const folders = [
    { id: "inbox" as MailFolder, label: "Inbox", icon: Inbox },
    { id: "sent" as MailFolder, label: "Sent", icon: Send },
    { id: "drafts" as MailFolder, label: "Drafts", icon: FileText },
    { id: "starred" as MailFolder, label: "Starred", icon: Star },
    { id: "trash" as MailFolder, label: "Trash", icon: Trash2 },
  ];

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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(184,155,94,0.18)", border: "1px solid rgba(184,155,94,0.45)" }}>
            <span className="font-black text-base" style={{ fontFamily: "Orbitron, sans-serif", color: "#B89B5E" }}>Q</span>
          </div>
          <span className="text-lg font-bold tracking-widest" style={{ fontFamily: "Orbitron, sans-serif", color: "#FAF3E7" }}>Qumail</span>
        </Link>

        <div className="hidden md:flex flex-1 justify-center px-4">
          <span className="text-xs tracking-widest uppercase" style={{ fontFamily: "JetBrains Mono, monospace", color: "rgba(250,243,231,0.45)" }}>
            Quantum Secure Email Communication
          </span>
        </div>

        <div className="flex items-center flex-shrink-0">
          <ProfileDropdown isDark={false} />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex pt-16" style={{ height: "calc(100vh - 4rem)" }}>

        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 p-4 space-y-4 overflow-y-auto hide-scrollbar" style={{ borderRight: "1px solid #E6DDD2" }}>
          <button
            onClick={() => navigate("/compose")}
            className="w-full py-3 px-5 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] flex items-center justify-center gap-2"
            style={{ background: "#B89B5E", color: "#FAF3E7", boxShadow: "0 4px 22px rgba(184,155,94,0.35)", fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#A6874E")}
            onMouseLeave={e => (e.currentTarget.style.background = "#B89B5E")}
          >
            <Edit className="w-4 h-4" />Compose
          </button>

          <div className="space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    if (folder.id === "inbox") {
                      setActiveFolder("inbox");
                      navigate("/dashboard");
                    } else {
                      setShowSectionMessage(true);

                      setTimeout(() => {
                        setShowSectionMessage(false);
                      }, 2500);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200"
                  style={{
                    background: isActive ? "rgba(184,155,94,0.14)" : "transparent",
                    border: isActive ? "1px solid rgba(184,155,94,0.35)" : "1px solid transparent",
                    color: isActive ? "#B89B5E" : "#7A6D63",
                    boxShadow: isActive ? "0 0 15px rgba(184,155,94,0.12)" : "none",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left text-sm font-medium">{folder.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Email Reading Area */}
        <main className="flex-1 flex flex-col overflow-y-auto hide-scrollbar">
          <div className="p-6 max-w-5xl mx-auto w-full">

            {/* Back button */}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 mb-6 text-sm transition-all duration-200 hover:gap-3"
              style={{ color: "#B89B5E", fontFamily: "JetBrains Mono, monospace" }}
            >
              <ArrowLeft className="w-4 h-4" />Back to Dashboard
            </button>

            {/* Email Card */}
            <div className="rounded-2xl overflow-hidden mb-6" style={warmCard}>

              {/* Email Header */}
              <div className="p-8 pb-6" style={{ borderBottom: "1px solid #E6DDD2" }}>
                <h1 className="text-2xl font-bold mb-6" style={{ color: "#3B2A23", fontFamily: "Orbitron, sans-serif" }}>
                  {mailData?.subject}
                </h1>

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#B89B5E", color: "#FAF3E7", fontFamily: "Orbitron, sans-serif", fontSize: "0.85rem", fontWeight: 700 }}>
                      {mailData?.sender?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-1" style={{ color: "#3B2A23" }}>{mailData?.username}</h3>
                      {draft ? (
                        <>
                          <p
                            className="text-sm mb-1"
                            style={{ color: "#7A6D63" }}
                          >
                            From: {mailData?.sender || "Draft"}
                          </p>

                          <p
                            className="text-xs"
                            style={{ color: "#A89B91" }}
                          >
                            To: {mailData?.recipient || mailData?.receiver || mailData?.to || "Not specified"}
                          </p>
                        </>
                      ) : activeFolder === "trash" ? (
                        <>
                          <p
                            className="text-sm mb-1"
                            style={{ color: "#7A6D63" }}
                          >
                            From: {mailData?.sender || "Unknown"}
                          </p>

                          <p
                            className="text-xs"
                            style={{ color: "#A89B91" }}
                          >
                            To: {mailData?.recipient || mailData?.receiver || "Unknown"}
                          </p>
                        </>
                      ) : activeFolder === "sent" ? (
                        <>
                          <p
                            className="text-sm mb-1"
                            style={{ color: "#7A6D63" }}
                          >
                            From: {mailData?.sender}
                          </p>

                          <p
                            className="text-xs"
                            style={{ color: "#A89B91" }}
                          >
                            To: {mailData?.recipient || mailData?.receiver || mailData?.receivers}
                          </p>
                        </>
                      ) : (
                        <>
                          <p
                            className="text-sm mb-1"
                            style={{ color: "#7A6D63" }}
                          >
                            From: {mailData?.sender}
                          </p>

                          <p
                            className="text-xs"
                            style={{ color: "#A89B91" }}
                          >
                            To: You
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm mb-1" style={{ color: "#7A6D63", fontFamily: "JetBrains Mono, monospace" }}>{mailData?.created_at}</p>
                    <p className="text-xs" style={{ color: "#A89B91" }}>{mailData?.relativeTime}</p>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: "rgba(184,155,94,0.1)", border: "1px solid rgba(184,155,94,0.3)" }}>
                    <Lock className="w-3.5 h-3.5" style={{ color: "#B89B5E" }} />
                    <span className="text-xs font-semibold" style={{ color: "#B89B5E", fontFamily: "JetBrains Mono, monospace" }}>ENCRYPTED</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: "rgba(184,155,94,0.07)", border: "1px solid rgba(184,155,94,0.2)" }}>
                    <Shield className="w-3.5 h-3.5" style={{ color: "#B89B5E" }} />
                    <span className="text-xs font-semibold" style={{ color: "#B89B5E", fontFamily: "JetBrains Mono, monospace" }}>QUANTUM SECURED</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: "rgba(0,170,85,0.08)", border: "1px solid rgba(0,170,85,0.25)" }}>
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: "#00aa55" }} />
                    <span className="text-xs font-semibold" style={{ color: "#00aa55", fontFamily: "JetBrains Mono, monospace" }}>VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="px-8 py-4 flex items-center gap-2" style={{ background: "rgba(184,155,94,0.025)", borderBottom: "1px solid #E6DDD2" }}>
                {activeFolder === "trash" ? (
                  <>
                    <button
                      onClick={handleRestoreMail}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                      style={goldBtn}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Restore
                    </button>

                    <button
                      onClick={() => setShowPermanentDeleteDialog(true)}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                      style={{
                        background: "rgba(204,0,0,0.08)",
                        border: "1px solid rgba(204,0,0,0.2)",
                        color: "#cc0000",
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Permanently
                    </button>
                  </>
                ) : draft ? (
                  <>
                    <button
                      onClick={() => {
                        setEditedMessage(mailData?.message || "");
                        setIsEditing(true);
                      }}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                      style={goldBtn}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="p-2 rounded-lg"
                      style={{
                        background: "rgba(204,0,0,0.08)",
                        border: "1px solid rgba(204,0,0,0.2)",
                        color: "#cc0000",
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                  {activeFolder === "inbox" && (
                    <button onClick={handleReplyScroll} className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105" style={goldBtn}>
                      <Reply className="w-4 h-4" />Reply
                    </button>
                    )}
                    <button
                      onClick={() => { setShowForwardDialog(true); setForwardSearch(""); setSelectedRecipients([]); fetchUsers(); }}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105" style={goldBtn}
                    >
                      <Forward className="w-4 h-4" />Forward
                    </button>
                    
                    {!mailData?.is_read && (
                      <button
                        onClick={() => {
                          setEditedMessage(mailData?.message || "");
                          setIsEditing(true);
                        }}
                        className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105"
                        style={{ background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.22)", color: "#ff8800" }}
                      >
                        <Edit className="w-4 h-4" />Edit
                      </button>
                    )}
                    <button
                      onClick={handleToggleStar}
                      className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                      style={{
                        background: isStarred ? "rgba(184,155,94,0.15)" : "rgba(184,155,94,0.08)",
                        border: isStarred ? "1px solid rgba(184,155,94,0.4)" : "1px solid rgba(184,155,94,0.2)",
                        color: isStarred ? "#B89B5E" : "#A89B91",
                        boxShadow: isStarred ? "0 0 20px rgba(184,155,94,0.25)" : "none",
                      }}
                    >
                      <Star className="w-4 h-4" fill={isStarred ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => setShowDeleteDialog(true)} className="p-2 rounded-lg transition-all duration-200 hover:scale-105" style={{ background: "rgba(204,0,0,0.08)", border: "1px solid rgba(204,0,0,0.2)", color: "#cc0000" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Email Body */}
              <div className="p-8">
                <div style={{ color: "#3B2A23", lineHeight: "1.75", fontSize: "0.95rem" }}>
                  {isEditing ? (
                    <div className="space-y-4">

                      <textarea
                        value={editedMessage}
                        onChange={(e) =>
                          setEditedMessage(e.target.value)
                        }
                        className="w-full min-h-[300px] rounded-xl p-5 resize-y outline-none"
                        style={{
                          border: "1px solid #D8C7A5",
                          background: "#FFFCF7",
                          color: "#3B2A23",
                          fontSize: "16px",
                          lineHeight: "1.7",
                        }}
                      />

                      <div className="flex gap-3">

                        <button
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className="px-6 py-3 rounded-xl font-semibold"
                          style={{
                            background: "#B89B5E",
                            color: "#FFFFFF",
                          }}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={() => {
                            setEditedMessage(mailData?.message || "");
                            setIsEditing(false);
                          }}
                          className="px-6 py-3 rounded-xl"
                          style={{
                            border: "1px solid #D8C7A5",
                            background: "#FFFFFF",
                            color: "#7A6D63",
                          }}
                        >
                          Cancel
                        </button>

                      </div>

                    </div>
                  ) : (
                    <p
                      className="whitespace-pre-wrap"
                      style={{
                        color: "#7A6D63",
                        fontSize: "16px",
                        lineHeight: "1.7",
                      }}
                    >
                      {mailData?.message}
                    </p>
                  )}
                  {mailData?.attachment && (
                    <div className="mt-6">
                      <button
                        onClick={() => window.open(`http://127.0.0.1:8000/download-attachment/${id}/`, "_blank")}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer hover:scale-105 transition-all"
                        style={{ border: "1px solid #E6DDD2", background: "rgba(184,155,94,0.06)" }}
                      >
                        📎
                        <div className="text-left">
                          <div className="font-semibold" style={{ color: "#3B2A23" }}>{mailData.attachment.split("/").pop()?.replace(".enc", "")}</div>
                          <div className="text-xs" style={{ color: "#7A6D63" }}>Click to download</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {mailData?.attachments?.length > 0 && (
                <div className="px-8 py-6" style={{ borderTop: "1px solid #E6DDD2", background: "rgba(184,155,94,0.025)" }}>
                  <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "#A89B91", fontFamily: "JetBrains Mono, monospace" }}>
                    Attachments ({mailData.attachments.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mailData.attachments.map((attachment: any) => (
                      <div key={attachment.id} className="rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02]" style={{ background: "rgba(184,155,94,0.06)", border: "1px solid #E6DDD2" }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(184,155,94,0.12)" }}>
                          <FileIcon className="w-5 h-5" style={{ color: "#B89B5E" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "#3B2A23" }}>{attachment.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs" style={{ color: "#A89B91", fontFamily: "JetBrains Mono, monospace" }}>{attachment.size}</p>
                            {attachment.encrypted && (
                              <div className="flex items-center gap-1">
                                <Lock className="w-3 h-3" style={{ color: "#B89B5E" }} />
                                <span className="text-xs" style={{ color: "#B89B5E", fontFamily: "JetBrains Mono, monospace" }}>Encrypted</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("access");
                              const response = await fetch(`http://127.0.0.1:8000/download-attachment/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = attachment.name;
                              document.body.appendChild(a); a.click(); a.remove();
                              window.URL.revokeObjectURL(url);
                            } catch (error) { console.log(error); }
                          }}
                          className="p-2 rounded-lg transition-all duration-200 hover:scale-110" style={goldBtn}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply / Draft Action Section */}
            {activeFolder === "inbox" ? (
              <div id="reply-section" className="rounded-2xl overflow-hidden" style={warmCard}>
                <div className="p-6">
                  <h3
                    className="text-sm font-semibold mb-4 uppercase tracking-wider"
                    style={{
                      color: "#A89B91",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    Reply
                  </h3>

                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={6}
                    className="w-full rounded-xl p-4 text-sm mb-4 resize-none transition-all duration-200"
                    style={{
                      background: "#FFFDF9",
                      border: "1px solid #DCCFC0",
                      color: "#3B2A23",
                      outline: "none",
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#B89B5E")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#DCCFC0")}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSendReply}
                      className="px-6 py-2.5 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] flex items-center gap-2"
                      style={{
                        background: "#B89B5E",
                        color: "#FAF3E7",
                        boxShadow: "0 4px 22px rgba(184,155,94,0.35)",
                        fontFamily: "Orbitron, sans-serif",
                        fontSize: "0.7rem",
                        letterSpacing: "0.15em",
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Send Reply
                    </button>

                    <label
                      className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
                      style={goldBtn}
                    >
                      <Paperclip className="w-4 h-4" />
                      {replyAttachment ? replyAttachment.name : "Attach"}

                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setReplyAttachment(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    <div className="flex-1" />

                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" style={{ color: "#B89B5E" }} />
                      <span
                        className="text-xs"
                        style={{
                          color: "#B89B5E",
                          fontFamily: "JetBrains Mono, monospace",
                        }}
                      >
                        Quantum Encryption Enabled
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : draft ? (
              <div className="rounded-2xl overflow-hidden" style={warmCard}>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSendDraft}
                      className="px-6 py-2.5 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] flex items-center gap-2"
                      style={{
                        background: "#B89B5E",
                        color: "#FAF3E7",
                        boxShadow: "0 4px 22px rgba(184,155,94,0.35)",
                        fontFamily: "Orbitron, sans-serif",
                        fontSize: "0.7rem",
                        letterSpacing: "0.15em",
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>

                    <label
                      className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
                      style={goldBtn}
                    >
                      <Paperclip className="w-4 h-4" />
                      {replyAttachment ? replyAttachment.name : "Attach"}

                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setReplyAttachment(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null }

            {/* Notifications */}
            {showNotification && (
              <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl" style={{ background: "rgba(184,155,94,0.12)", border: "1px solid rgba(184,155,94,0.4)", color: "#B89B5E", fontFamily: "Orbitron, sans-serif" }}>
                {notificationMessage}
              </div>
            )}
            {showForwardNotification && (
              <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl" style={{ background: "rgba(184,155,94,0.12)", border: "1px solid rgba(184,155,94,0.4)", color: "#B89B5E", fontFamily: "Orbitron, sans-serif" }}>
                Email Forwarded Successfully
              </div>
            )}
            {showSectionMessage && (
              <div
                className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl"
                style={{
                  background: "#FFFDF9",
                  border: "1px solid rgba(184,155,94,0.4)",
                  color: "#7A6D63",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.75rem",
                }}
              >
                Go back to main dashboard and continue with another section.
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-4" style={{ borderTop: "1px solid #E6DDD2" }}>
        <p className="text-center text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#A89B91" }}>
          &copy; Qumail Application 2026
        </p>
      </footer>

      {/* Forward Dialog */}
      {showForwardDialog && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(59,42,35,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 1003 }}>
          <div className="rounded-2xl overflow-hidden w-full max-w-2xl mx-4" style={{ background: "#FFFDF9", border: "1px solid #E6DDD2", boxShadow: "0 24px 80px rgba(59,42,35,0.18)" }}>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "#3B2A23", fontFamily: "Orbitron, sans-serif" }}>Forward Email</h2>
                  <p className="text-xs mt-1" style={{ color: "#7A6D63", lineHeight: 1.5 }}>Search all registered users and select recipients to forward this message.</p>
                </div>
                <button onClick={() => setShowForwardDialog(false)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105" style={{ background: "rgba(204,0,0,0.1)", border: "1px solid rgba(204,0,0,0.22)", color: "#cc0000" }}>Close</button>
              </div>

              <input
                value={forwardSearch}
                onChange={(e) => setForwardSearch(e.target.value)}
                placeholder="Search registered users..."
                className="w-full rounded-xl px-4 py-3 text-sm transition-all duration-200"
                style={{ background: "#FFFDF9", border: "1px solid #DCCFC0", color: "#3B2A23", outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = "#B89B5E")}
                onBlur={e => (e.currentTarget.style.borderColor = "#DCCFC0")}
              />

              <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <label key={user.username} className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors duration-200 cursor-pointer" style={{ background: "rgba(184,155,94,0.05)", border: "1px solid #E6DDD2", color: "#3B2A23" }}>
                    <input
                      type="checkbox"
                      checked={selectedRecipients.includes(user.username)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRecipients((prev) => [...prev, user.username]);
                        else setSelectedRecipients((prev) => prev.filter((u) => u !== user.username));
                      }}
                      className="h-4 w-4 rounded border"
                    />
                    <span className="text-sm font-medium">{user.username}</span>
                  </label>
                )) : (
                  <div className="rounded-2xl px-4 py-4 text-sm" style={{ background: "rgba(184,155,94,0.03)", color: "#7A6D63" }}>No users match your search.</div>
                )}
              </div>

              {selectedRecipients.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedRecipients.map((user) => (
                    <span key={user} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(184,155,94,0.15)", color: "#B89B5E" }}>{user}</span>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                <button
                  onClick={handleForwardSend}
                  disabled={selectedRecipients.length === 0}
                  className="px-6 py-3 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#B89B5E", color: "#FAF3E7", boxShadow: "0 4px 22px rgba(184,155,94,0.35)", fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em" }}
                >
                  Send Forward
                </button>
                <button onClick={() => setShowForwardDialog(false)} className="px-6 py-3 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-[1.02]" style={{ background: "rgba(204,0,0,0.1)", border: "1px solid rgba(204,0,0,0.22)", color: "#cc0000", fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Dialog */}
      {showOtpDialog && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(59,42,35,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 1002 }}>
          <div className="rounded-2xl overflow-hidden w-full max-w-md mx-4" style={{ background: "#FFFDF9", border: "1px solid #E6DDD2", boxShadow: "0 24px 80px rgba(59,42,35,0.18)" }}>
            {!isDecrypting ? (
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="relative w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(184,155,94,0.15)", border: "2px solid rgba(184,155,94,0.35)", boxShadow: "0 0 30px rgba(184,155,94,0.2)" }}>
                    <Shield className="w-6 h-6" style={{ color: "#B89B5E" }} />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-center mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#3B2A23" }}>OTP Verification</h2>
                {/* <p className="text-center text-xs mb-1" style={{ color: "#7A6D63", lineHeight: "1.5" }}>An OTP has been sent to your registered email address.</p> */}
                <p className="text-center text-xs mb-4" style={{ color: "#A89B91", fontFamily: "JetBrains Mono, monospace" }}>Please enter the verification code below.</p>

                <div className="flex gap-2 justify-center mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-11 h-12 text-center text-lg font-bold rounded-lg transition-all duration-200"
                      style={{
                        background: "#FFFDF9",
                        border: digit ? "2px solid #B89B5E" : "1px solid #DCCFC0",
                        color: "#3B2A23",
                        outline: "none",
                        boxShadow: digit ? "0 0 20px rgba(184,155,94,0.2)" : "none",
                        fontFamily: "JetBrains Mono, monospace",
                      }}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="text-center mb-4">
                  <p className="text-xs" style={{ color: countdown < 10 ? "#cc0000" : "#A89B91", fontFamily: "JetBrains Mono, monospace" }}>
                    {canResend ? "You can now resend OTP" : `Resend OTP in ${countdown} seconds`}
                  </p>
                </div>

                <button
                  onClick={handleVerifyOtp}
                  className="w-full py-2.5 rounded-xl font-semibold tracking-widest uppercase transition-all duration-200 mb-3 hover:scale-[1.02]"
                  style={{ background: "#B89B5E", color: "#FAF3E7", boxShadow: "0 4px 22px rgba(184,155,94,0.35)", fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "0.18em" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#A6874E")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#B89B5E")}
                >
                  Verify OTP
                </button>

                <div className="flex gap-3 mb-3">
                  <button
                    onClick={handleResendOtp}
                    disabled={!canResend}
                    className="flex-1 py-2 rounded-lg font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "transparent", border: "1px solid rgba(184,155,94,0.35)", color: "#B89B5E", fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em" }}
                  >
                    Resend OTP
                  </button>
                  <button
                    onClick={handleCancelOtp}
                    className="flex-1 py-2 rounded-lg font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-[1.02]"
                    style={{ background: "rgba(204,0,0,0.1)", border: "1px solid rgba(204,0,0,0.22)", color: "#cc0000", fontFamily: "Orbitron, sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em" }}
                  >
                    Cancel
                  </button>
                </div>

                <div className="pt-3 flex items-center justify-center gap-2" style={{ borderTop: "1px solid #E6DDD2" }}>
                  <Lock className="w-3 h-3" style={{ color: "#A89B91" }} />
                  <span className="text-xs" style={{ fontFamily: "JetBrains Mono, monospace", color: "#A89B91" }}>Quantum-Secured Verification</span>
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(184,155,94,0.15)", border: "2px solid rgba(184,155,94,0.4)", boxShadow: "0 0 40px rgba(184,155,94,0.25)", animation: "pulse 1.5s ease-in-out infinite" }}>
                      <Lock className="w-10 h-10" style={{ color: "#B89B5E" }} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Orbitron, sans-serif", color: "#3B2A23" }}>Decrypting Mail</h3>
                  <p className="text-4xl font-bold mb-4" style={{ fontFamily: "JetBrains Mono, monospace", color: "#B89B5E" }}>{decryptProgress}%</p>
                  <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: "#E6DDD2" }}>
                    <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${decryptProgress}%`, background: "#B89B5E", boxShadow: "0 0 15px rgba(184,155,94,0.4)" }} />
                  </div>
                  <p className="text-xs" style={{ color: "#7A6D63", fontFamily: "JetBrains Mono, monospace" }}>
                    {decryptProgress < 30 && "Verifying quantum signature..."}
                    {decryptProgress >= 30 && decryptProgress < 60 && "Applying CRYSTALS-Kyber..."}
                    {decryptProgress >= 60 && decryptProgress < 90 && "Decrypting message content..."}
                    {decryptProgress >= 90 && "Complete!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(59,42,35,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 1001 }} onClick={cancelDelete}>
          <div className="rounded-2xl overflow-hidden w-full max-w-md mx-4" style={{ background: "#FFFDF9", border: "1px solid #E6DDD2", boxShadow: "0 24px 80px rgba(59,42,35,0.18)" }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(204,0,0,0.1)" }}>
                  <Trash2 className="w-5 h-5" style={{ color: "#cc0000" }} />
                </div>
                <h3 className="text-lg font-bold" style={{ fontFamily: "Orbitron, sans-serif", color: "#3B2A23" }}>Delete Email?</h3>
              </div>
              <p className="text-sm mb-6" style={{ color: "#7A6D63", lineHeight: "1.6" }}>
                Are you sure you want to delete this email? This email will be moved to trash and can be recovered for 30 days.
              </p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 py-2.5 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-[1.02]" style={{ background: "rgba(184,155,94,0.1)", border: "1px solid rgba(184,155,94,0.28)", color: "#B89B5E", fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em" }}>Cancel</button>
                <button onClick={handleDeleteMail} className="flex-1 py-2.5 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 hover:scale-[1.02]" style={{ background: "linear-gradient(135deg, #cc0000, #990000)", color: "#ffffff", boxShadow: "0 4px 22px rgba(204,0,0,0.3)", fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "0.15em" }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPermanentDeleteDialog && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            background: "rgba(59,42,35,0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1001,
          }}
          onClick={() => setShowPermanentDeleteDialog(false)}
        >
          <div
            className="rounded-2xl overflow-hidden w-full max-w-md mx-4"
            style={{
              background: "#FFFDF9",
              border: "1px solid #E6DDD2",
              boxShadow: "0 24px 80px rgba(59,42,35,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(204,0,0,0.1)" }}
                >
                  <Trash2 className="w-5 h-5" style={{ color: "#cc0000" }} />
                </div>

                <h3
                  className="text-lg font-bold"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    color: "#3B2A23",
                  }}
                >
                  Permanently Delete Email?
                </h3>
              </div>

              <p
                className="text-sm mb-6"
                style={{ color: "#7A6D63", lineHeight: "1.6" }}
              >
                Are you sure you want to permanently delete this email?
                This action cannot be undone and the email cannot be recovered.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPermanentDeleteDialog(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold"
                  style={{
                    background: "rgba(184,155,94,0.1)",
                    border: "1px solid rgba(184,155,94,0.28)",
                    color: "#B89B5E",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowPermanentDeleteDialog(false);
                    handlePermanentDelete();
                  }}
                  className="flex-1 py-2.5 rounded-xl font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #cc0000, #990000)",
                    color: "#ffffff",
                    boxShadow: "0 4px 22px rgba(204,0,0,0.3)",
                  }}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
