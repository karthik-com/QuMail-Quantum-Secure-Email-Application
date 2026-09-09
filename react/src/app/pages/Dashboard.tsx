import { useState, useEffect } from "react";
import { Link,useNavigate } from "react-router";
import {
  Send,
  FileText,
  Trash2,
  Star,
  Edit,
  Search,
  Filter,
  Bell,
  Settings,
  User,
  Inbox,
  Paperclip,
} from "lucide-react";

type MailFolder = "inbox" | "sent" | "drafts" | "trash" | "spam" | "starred";

export default function Dashboard() {
  const [activeFolder, setActiveFolder] = useState<MailFolder>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [emails, setEmails] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [quantumLoading, setQuantumLoading] = useState(false);
  const [quantumResult, setQuantumResult] = useState<any>(null);
  const [quantumError, setQuantumError] = useState("");
  const [mailCounts, setMailCounts] = useState({
    inbox: 0,
    sent: 0,
    drafts: 0,
    starred: 0,
    trash: 0,
  });

  const filteredEmails = [...emails]
    .filter((email: any) => {
      if (activeFolder === "drafts") return email.is_draft === true;
      if (activeFolder === "starred") return email.is_starred === true;
      if (activeFolder === "inbox") return !email.is_draft;
      return true;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(
        a.created_at || a.time
      ).getTime();

      const dateB = new Date(
        b.created_at || b.time
      ).getTime();

      return dateB - dateA;
    });

  const fetchMailCounts = async () => {
    try {
      const token = localStorage.getItem("access");
      const response = await fetch("http://127.0.0.1:8000/mail-counts/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMailCounts(data);
    } catch (error) {
      console.log(error);
    }
  };
  const runQuantumHardwareValidation = async () => {
  try {
    setQuantumLoading(true);
    setQuantumError("");
    setQuantumResult(null);

    const token = localStorage.getItem("access");

    if (!token) {
      setQuantumError("Authentication token not found. Please log in again.");
      return;
    }

    const response = await fetch(
      "http://127.0.0.1:8000/quantum-hardware/bb84/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Quantum validation failed.");
    }

    setQuantumResult(data.result);
  } catch (error: any) {
    console.error("Quantum hardware validation error:", error);
    setQuantumError(
      error.message || "Failed to run quantum hardware validation."
    );
  } finally {
    setQuantumLoading(false);
  }
};

  const searchEmails = async (query: string) => {
    if (!query.trim()) {
      fetchEmails();
      return;
    }
    const token = localStorage.getItem("access");
    const response = await fetch(
      `http://127.0.0.1:8000/search-mails/?q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    setEmails(data);
  };

  useEffect(() => {
    fetchEmails();
  }, [activeFolder]);

  useEffect(() => {
    fetchMailCounts();
  }, []);

  const toggleStar = async (mailId: number) => {
    try {
      const token = localStorage.getItem("access");
      await fetch(`http://127.0.0.1:8000/toggle-star/${mailId}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmails();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchEmails = async (folder: MailFolder = activeFolder) => {
    try {
      setIsFetching(true);

      const token = localStorage.getItem("access");
      let endpoint = "";

      if (folder === "inbox") {
        endpoint = "http://127.0.0.1:8000/inbox/";
      } else if (folder === "drafts") {
        endpoint = "http://127.0.0.1:8000/drafts/";
      } else if (folder === "sent") {
        endpoint = "http://127.0.0.1:8000/sent/";
      } else if (folder === "starred") {
        endpoint = "http://127.0.0.1:8000/starred/";
      } else if (folder === "trash") {
        endpoint = "http://127.0.0.1:8000/trash-mail/";
      } else {
        setEmails([]);
        return;
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();

      console.log(`📩 ${folder.toUpperCase()} RESPONSE:`, data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emails");
      }

      // Make sure we always work with an array
      const emailList = Array.isArray(data)
        ? data
        : Array.isArray(data.emails)
          ? data.emails
          : Array.isArray(data.data)
            ? data.data
            : [];

      console.log(`📩 ${folder.toUpperCase()} EMAIL LIST:`, emailList);

      if (folder === "drafts") {

        const formattedDrafts = emailList.map((draft: any) => ({
          ...draft,
          sender: draft.receivers || "Draft",
          preview: draft.message || "",
          time: draft.time,
          avatar: draft.receivers?.charAt(0)?.toUpperCase() || "D",
        }));

        setEmails(formattedDrafts);

      } else if (folder === "trash") {

        const formattedTrash = emailList.map((mail: any) => ({

          ...mail,

          // If mail was sent by me -> show recipient
          // If mail was received by me -> show sender
          displayEmail:
            mail.displayEmail ||
            (
              mail.mailType === "sent"
                ? mail.recipient
                : mail.sender
            ),

        }));

        console.log("FORMATTED TRASH:", formattedTrash);

        setEmails(formattedTrash);

      } else {

        setEmails(emailList);

      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsFetching(false);
    }
  };
  const handleLogoClick = async (
  e: React.MouseEvent<HTMLAnchorElement>
) => {
  e.preventDefault();

  setSearchQuery("");      // Clear search
  setActiveFolder("inbox"); // Go back to Inbox

  await fetchMailCounts();
  await fetchEmails();
};

  const folders = [
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "sent", label: "Sent", icon: Send },
    { id: "drafts", label: "Drafts", icon: FileText },
    { id: "starred", label: "Starred", icon: Star },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "#FAF3E7" }}
    >
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
        <Link
          to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-3 flex-shrink-0 no-underline"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(184,155,94,0.18)",
                border: "1px solid rgba(184,155,94,0.45)",
              }}
            >
              <span
                className="font-black text-base"
                style={{ fontFamily: "Orbitron, sans-serif", color: "#B89B5E" }}
              >
                Q
              </span>
            </div>

            <span
              className="text-lg font-bold tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif", color: "#FAF3E7" }}
            >
              Qumail
            </span>
          </Link>

        {/* Center tagline */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <span
            className="text-xs tracking-widest uppercase"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "rgba(250,243,231,0.45)" }}
          >
            Quantum Secure Email Communication
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{
              background: "#bb9b5e",
              border: "1px solid rgba(184, 155, 94, 0.35)",
              color: "#faf3e7",
            }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      {/* <div className="flex pt-16" style={{ height: "calc(100vh - 4rem)" }}> */}
      {/* Main Content Area */}
      <div className="flex flex-col pt-16" style={{ height: "calc(100vh - 4rem)" }}>

        {/* Quantum Hardware Validation */}
        <div
          className="mx-4 mt-4 mb-2 p-4 rounded-xl"
          style={{
            background: "#FFFDF9",
            border: "1px solid #E6DDD2",
            boxShadow: "0 2px 12px rgba(59,42,35,0.05)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2
                className="text-sm font-semibold"
                style={{
                  color: "#3B2A23",
                  fontFamily: "Orbitron, sans-serif",
                }}
              >
                Quantum Hardware Validation
              </h2>

              <p
                className="text-xs mt-1"
                style={{
                  color: "#7A6D63",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                Run BB84 key generation on real IBM Quantum hardware.
              </p>
            </div>

            <button
              onClick={runQuantumHardwareValidation}
              disabled={quantumLoading}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: quantumLoading ? "#DCCFC0" : "#B89B5E",
                color: "#FAF3E7",
                cursor: quantumLoading ? "not-allowed" : "pointer",
                fontFamily: "Orbitron, sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              {quantumLoading ? "Running..." : "Run Validation"}
            </button>
          </div>

          {/* Error */}
          {quantumError && (
            <div
              className="mt-3 p-3 rounded-lg text-xs"
              style={{
                background: "#FCECEC",
                border: "1px solid #E8B8B8",
                color: "#9B3A3A",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {quantumError}
            </div>
          )}

          {/* Result */}
          {quantumResult && (
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid #E6DDD2" }}
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

                <div>
                  <p className="text-xs" style={{ color: "#A89B91" }}>
                    Backend
                  </p>
                  <p
                    className="text-sm font-semibold mt-1"
                    style={{ color: "#3B2A23" }}
                  >
                    {quantumResult.backend}
                  </p>
                </div>

                <div>
                  <p className="text-xs" style={{ color: "#A89B91" }}>
                    Job ID
                  </p>
                  <p
                    className="text-xs font-semibold mt-1 truncate"
                    title={quantumResult.job_id}
                    style={{
                      color: "#3B2A23",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    {quantumResult.job_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs" style={{ color: "#A89B91" }}>
                    Key Agreement
                  </p>
                  <p
                    className="text-sm font-semibold mt-1"
                    style={{
                      color: quantumResult.key_agreement
                        ? "#5C7A4D"
                        : "#9B3A3A",
                    }}
                  >
                    {quantumResult.key_agreement ? "✓ Success" : "✗ Failed"}
                  </p>
                </div>

                <div>
                  <p className="text-xs" style={{ color: "#A89B91" }}>
                    Sifted Key
                  </p>
                  <p
                    className="text-sm font-semibold mt-1"
                    style={{ color: "#3B2A23" }}
                  >
                    {quantumResult.sifted_key_length} bits
                  </p>
                </div>

                <div>
                  <p className="text-xs" style={{ color: "#A89B91" }}>
                    AES Key
                  </p>
                  <p
                    className="text-sm font-semibold mt-1"
                    style={{ color: "#3B2A23" }}
                  >
                    {quantumResult.aes_key_length} bits
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>
        {/* Left Sidebar */}
        <div className="flex flex-1 min-h-0">
        <aside
          className="w-64 flex-shrink-0 p-4 space-y-4 overflow-y-auto hide-scrollbar"
          style={{ borderRight: "1px solid #E6DDD2" }}
        >
          {/* Compose Button */}
          <Link
            to="/compose"
            className="w-full py-3 px-5 rounded-xl font-semibold tracking-wide uppercase transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] flex items-center justify-center gap-2 no-underline"
            style={{
              background: "#B89B5E",
              color: "#FAF3E7",
              boxShadow: "0 4px 22px rgba(184,155,94,0.35)",
              fontFamily: "Orbitron, sans-serif",
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#A6874E")}
            onMouseLeave={e => (e.currentTarget.style.background = "#B89B5E")}
          >
            <Edit className="w-4 h-4" />
            Compose
          </Link>

          {/* Folder List */}
          <div className="space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon;
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => {
                    setActiveFolder(folder.id as MailFolder);
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

        {/* Right Content Area - Email List */}
        <main className="flex-1 flex flex-col" style={{ background: "#FAF3E7" }}>
          {/* Search Bar */}
          <div
            className="p-4"
            style={{ borderBottom: "1px solid #E6DDD2" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "#A89B91" }}
                />
                <input
                  type="text"
                  placeholder="Search mail..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchEmails(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all duration-200"
                  style={{
                    background: "#FFFDF9",
                    border: "1px solid #DCCFC0",
                    color: "#3B2A23",
                    outline: "none",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#B89B5E")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#DCCFC0")}
                />
              </div>
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 hide-scrollbar">
            {isFetching ? null : filteredEmails.length === 0 ? (
              <div
                className="flex items-center justify-center h-64"
                style={{
                  color: "#A89B91",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {searchQuery.trim()
                  ? `No emails found for "${searchQuery}"`
                  : "No emails found"}
              </div>
            ) : (
              filteredEmails.map((email: any) => (
                <div
                  key={`${email.subject}-${email.time}`}
                  className="rounded-xl p-4 transition-all duration-200 cursor-pointer hover:scale-[1.01]"
                  style={{
                    background: email.unread ? "rgba(184,155,94,0.08)" : "#FFFDF9",
                    border: email.unread
                      ? "1px solid rgba(184,155,94,0.3)"
                      : "1px solid #E6DDD2",
                    boxShadow: email.unread
                      ? "0 2px 15px rgba(184,155,94,0.1)"
                      : "0 1px 8px rgba(59,42,35,0.04)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "#B89B5E",
                        color: "#FAF3E7",
                        fontFamily: "Orbitron, sans-serif",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      {email.avatar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-semibold text-sm"
                          onClick={() =>
                            navigate(`/readmail/${email.id}`, {
                              state: {
                                folder: activeFolder,
                                draft: activeFolder === "drafts" ? email : null,
                                // Preserve Trash mail direction
                                mailType: activeFolder === "trash" ? email.mailType : null,
                                sender: activeFolder === "trash" ? email.sender : null,
                                recipient: activeFolder === "trash" ? email.recipient : null,
                              },
                            })
                          }
                          style={{
                            fontWeight: email.unread ? 700 : 500,
                            color: "#3B2A23",
                            cursor: "pointer",
                          }}
                        >
                          {activeFolder === "sent"
                            ? email.recipient
                            : activeFolder === "trash"
                              ? email.displayEmail
                              : email.sender}
                        </span>
                        {email.hasAttachment && (
                          <Paperclip className="w-3 h-3" style={{ color: "#A89B91" }} />
                        )}
                      </div>
                      <p
                        className="text-sm mb-1.5"
                        style={{
                          fontWeight: email.unread ? 600 : 400,
                          color: email.unread ? "#3B2A23" : "#7A6D63",
                        }}
                      >
                        {email.subject}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {activeFolder === "sent" && (
                        email.is_read ? (
                          <span className="text-xs font-medium" style={{ color: "#B89B5E" }}>
                            ✓✓ Read
                          </span>
                        ) : (
                          <span className="text-xs font-medium" style={{ color: "#7A6D63" }}>
                            ✓ Sent
                          </span>
                        )
                      )}

                      <span
                        className="text-xs"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          color: "#A89B91",
                        }}
                      >
                        {email.time}
                      </span>

                      <button
                        onClick={() => toggleStar(email.id)}
                        className="transition-all duration-200 hover:scale-110"
                        style={{
                          color: email.is_starred ? "#B89B5E" : "#DCCFC0",
                        }}
                      >
                        <Star
                          className="w-4 h-4"
                          fill={email.is_starred ? "currentColor" : "none"}
                        />
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem("access");
                            await fetch(`http://127.0.0.1:8000/delete-mail/${email.id}/`, {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            fetchEmails();
                          } catch (error) {
                            console.log(error);
                          }
                        }}
                      >
                        {/* Trash icon intentionally hidden per original */}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
      </div>
      {/* Footer */}
      <footer
        className="py-4"
        style={{ borderTop: "1px solid #E6DDD2" }}
      >
        <p
          className="text-center text-xs"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#A89B91" }}
        >
          &copy; Qumail Application 2026
        </p>
        
      </footer>
    </div>
  );
}

