import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Shield,
  Mail,
  ChevronRight,
  Lock,
  CheckCircle,
  Paperclip,
  Clock,
  User,
  Search,
  MessageSquare,
  X,
  CornerDownLeft,
  Send,
} from "lucide-react";


// =========================================================
// API CONFIGURATION
// =========================================================

const API_BASE_URL = "http://127.0.0.1:8000";


// =========================================================
// TYPES
// =========================================================

interface EmailMessage {
  id: number;

  sender_name: string;
  sender_email: string;

  receiver_name: string;
  receiver_email: string;

  subject: string;

  body: string;

  timestamp: string;

  attachments: {
    name: string;
    size: string;
  }[];

  is_encrypted: boolean;
  is_verified: boolean;
  is_read: boolean;

  isAdminSent?: boolean;
}


interface Conversation {
  subject: string;

  messages: EmailMessage[];

  participants: string[];

  participant_emails: string[];

  latest_timestamp: string;

  message_count: number;

  preview: string;
}


// =========================================================
// BACKEND MAIL TYPE
// =========================================================

interface BackendMail {
  id: number;

  sender: string;
  sender_name: string;

  receiver: string;
  receiver_name: string;

  subject: string;

  message: string;

  created_at: string;

  is_replied: boolean;
  is_read: boolean;
  is_starred: boolean;

  hasAttachment: boolean;

  attachment: string | null;
}


// =========================================================
// GROUP EMAILS INTO CONVERSATIONS
// =========================================================

function groupIntoConversations(
  emails: EmailMessage[]
): Conversation[] {

  const map = new Map<string, EmailMessage[]>();

  for (const email of emails) {

    const key = email.subject
        .trim()
        .toLowerCase()
        .replace(/^(re:\s*|fwd:\s*)+/i, "")
        .trim();

    if (!map.has(key)) {
      map.set(key, []);
    }

    map
      .get(key)!
      .push(email);
  }


  return Array.from(map.entries())

    .map(([, msgs]) => {

      const sorted =
        [...msgs].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() -
            new Date(b.timestamp).getTime()
        );


      const latest =
        sorted[sorted.length - 1];


      const nameSet =
        new Set<string>();


      const emailSet =
        new Set<string>();


      for (const m of sorted) {

        nameSet.add(
          m.sender_name
        );

        nameSet.add(
          m.receiver_name
        );

        emailSet.add(
          m.sender_email
        );

        emailSet.add(
          m.receiver_email
        );
      }


      return {

        subject:
          sorted[0].subject,

        messages:
          sorted,

        participants:
          [...nameSet].filter(Boolean),

        participant_emails:
          [...emailSet].filter(Boolean),

        latest_timestamp:
          latest.timestamp,

        message_count:
          sorted.length,

        preview:
          latest.body
            ?.split("\n")
            .find(
              (line) =>
                line.trim()
            ) || "",
      };
    })


    .sort(
      (a, b) =>
        new Date(
          b.latest_timestamp
        ).getTime() -
        new Date(
          a.latest_timestamp
        ).getTime()
    );
}


// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(ts: string) {

  const d =
    new Date(ts);

  if (isNaN(d.getTime())) {
    return ts;
  }

  return d.toLocaleString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
}


// =========================================================
// INITIALS
// =========================================================

function initials(name: string) {

  return name
    .split(" ")
    .map(
      (w) => w[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}


// =========================================================
// AVATAR PALETTES
// =========================================================

const AVATAR_PALETTES = [

  {
    bg: "linear-gradient(135deg,#B89B5E,#A6874E)",
    color: "#FAF3E7",
  },

  {
    bg: "linear-gradient(135deg,#3B2A23,#6B4232)",
    color: "#B89B5E",
  },

  {
    bg: "rgba(184,155,94,0.2)",
    color: "#7A5C2E",
  },

  {
    bg: "rgba(59,42,35,0.15)",
    color: "#3B2A23",
  },

];


const av = (i: number) =>
  AVATAR_PALETTES[
    i % AVATAR_PALETTES.length
  ];


// =========================================================
// CONVERSATION STATUS
// =========================================================

function convStatus(
  ts: string
): {
  dot: string;
  label: string;
  bg: string;
  border: string;
} {

  const diff =
    Date.now() -
    new Date(ts).getTime();

  const hours =
    diff / 3_600_000;


  if (hours < 24) {

    return {
      dot: "#00cc66",
      label: "Active",
      bg: "rgba(0,204,102,0.08)",
      border: "rgba(0,204,102,0.22)",
    };

  }


  if (hours < 168) {

    return {
      dot: "#E8A838",
      label: "Recent",
      bg: "rgba(232,168,56,0.09)",
      border: "rgba(232,168,56,0.25)",
    };

  }


  return {

    dot: "#A89B91",

    label: "Archived",

    bg: "rgba(168,155,145,0.08)",

    border:
      "rgba(168,155,145,0.2)",
  };
}


// =========================================================
// CONVERSATION CARD
// =========================================================

function ConversationCard({

  conv,

  onClick,

}: {

  conv: Conversation;

  onClick: () => void;

}) {

  const status =
    convStatus(
      conv.latest_timestamp
    );


  const hasUnread = conv.messages.some(
    (msg) =>
      !msg.is_read &&
      !msg.isAdminSent
  );


  return (

    <button

      onClick={onClick}

      className="w-full text-left rounded-2xl px-5 py-4 transition-all duration-200 hover:scale-[1.005] group"

      style={{
        background: hasUnread
          ? "#5A4033"
          : "#FFFDF9",

        border: hasUnread
          ? "1px solid #8B6B4F"
          : "1px solid #E6DDD2",

        boxShadow: hasUnread
          ? "0 4px 18px rgba(59,42,35,0.18)"
          : "0 2px 12px rgba(59,42,35,0.05)",
      }}

    >

      <div className="flex items-center gap-4">


        {/* STATUS */}

        <div className="flex-shrink-0 flex flex-col items-center gap-1.5">

          <div

            className="w-2.5 h-2.5 rounded-full"

            style={{

              background:
                status.dot,

              boxShadow:
                `0 0 6px ${status.dot}88`,
            }}

          />


          <div

            className="w-8 h-8 rounded-xl flex items-center justify-center"

            style={{

              background:
                "rgba(184,155,94,0.08)",

              color:
                "#B89B5E",
            }}

          >

            <Mail size={14} />

          </div>

        </div>


        {/* CONTENT */}

        <div className="flex-1 min-w-0">

          <div className="flex items-center justify-between gap-2 mb-2">

            <p

              className="truncate"

              style={{

                fontFamily:
                  "Orbitron, sans-serif",

                color: hasUnread
                  ? "#FAF3E7"
                  : "#3B2A23",

                fontSize:
                  "0.8rem",

                fontWeight:
                  hasUnread ? 800 : 700,

                letterSpacing:
                  "0.02em",
              }}

            >

              {conv.subject}

            </p>


            <ChevronRight

              size={14}

              style={{
                color: "#B89B5E",
                flexShrink: 0,
              }}

              className="group-hover:translate-x-0.5 transition-transform"

            />

          </div>


          <div className="flex flex-wrap items-center gap-2">


            {/* MESSAGE COUNT */}

            <span

              className="flex items-center gap-1 px-2 py-0.5 rounded-full"

              style={{

                background:
                  "rgba(184,155,94,0.1)",

                color:
                  "#B89B5E",

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.58rem",

                fontWeight:
                  700,
              }}

            >

              <MessageSquare size={9} />

              {conv.message_count}

              {" msg"}

            </span>


            {/* STATUS */}

            <span

              className="flex items-center gap-1 px-2 py-0.5 rounded-full"

              style={{

                background:
                  status.bg,

                border:
                  `1px solid ${status.border}`,

                color:
                  status.dot,

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.56rem",

                fontWeight:
                  700,
              }}

            >

              <span

                style={{

                  width: 5,

                  height: 5,

                  borderRadius: "50%",

                  background:
                    status.dot,

                  display:
                    "inline-block",

                  flexShrink: 0,
                }}

              />

              {status.label}

            </span>


            {/* TIMESTAMP */}

            <span

              className="flex items-center gap-1 ml-auto"

              style={{

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.6rem",

                color:
                  "#A89B91",

                flexShrink: 0,
              }}

            >

              <Clock size={9} />

              {formatDate(
                conv.latest_timestamp
              )}

            </span>

          </div>

        </div>

      </div>

    </button>
  );
}


// =========================================================
// MESSAGE BUBBLE
// =========================================================

function MessageBubble({

  msg,

  idx,

  isAdminSent,

  isLatest,

  showReplyButton,

  onReply,

}: {

  msg: EmailMessage;

  idx: number;

  isAdminSent: boolean;

  isLatest: boolean;

  showReplyButton: boolean;

  onReply: (
    replyText: string,
    file: File | null
  ) => void;

}) {


  const pal =
    av(idx % 2);


  const [showReply, setShowReply] =
    useState(false);


  const [replyText, setReplyText] =
    useState("");


  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);


  const fileRef =
    useRef<HTMLInputElement>(null);


  const handleSend = () => {

    if (!replyText.trim()) {
      return;
    }


    onReply(
      replyText,
      selectedFile
    );


    setReplyText("");

    setSelectedFile(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    setShowReply(false);
  };


  const handleCancel = () => {

    setReplyText("");

    setSelectedFile(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }

    setShowReply(false);
  };


  const cardBorder =
    isLatest

      ? "2px solid rgba(184,155,94,0.55)"

      : isAdminSent

        ? "1px solid rgba(184,155,94,0.25)"

        : "1px solid #E6DDD2";


  const cardBg =
    isLatest

      ? "rgba(184,155,94,0.07)"

      : isAdminSent

        ? "rgba(184,155,94,0.04)"

        : "#FFFDF9";


  const cardShadow =
    isLatest

      ? "0 0 0 3px rgba(184,155,94,0.12), 0 4px 20px rgba(184,155,94,0.18)"

      : "0 2px 10px rgba(59,42,35,0.04)";


  return (

    <div>

      <div

        className="rounded-2xl overflow-hidden"

        style={{

          background:
            cardBg,

          border:
            cardBorder,

          boxShadow:
            cardShadow,
        }}

      >


        {/* HEADER */}

        <div

          className="flex items-start gap-3 px-5 py-4"

          style={{

            borderBottom:
              "1px solid #E6DDD2",

            background:
              isAdminSent

                ? "rgba(184,155,94,0.09)"

                : "rgba(184,155,94,0.025)",
          }}

        >

          <div

            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"

            style={{

              background:

                isAdminSent

                  ? "linear-gradient(135deg,#B89B5E,#A6874E)"

                  : pal.bg,

              color:

                isAdminSent

                  ? "#FAF3E7"

                  : pal.color,

              fontFamily:
                "Orbitron, sans-serif",

              fontSize:
                "0.58rem",

              fontWeight:
                800,
            }}

          >

            {isAdminSent
              ? "AD"
              : initials(
                  msg.sender_name
                )}

          </div>


          <div className="flex-1 min-w-0">

            <div className="flex items-center justify-between mb-0.5 flex-wrap gap-2">

              <div className="flex items-center gap-2 flex-wrap">

                <p

                  style={{

                    fontFamily:
                      "Orbitron, sans-serif",

                    color:
                      "#3B2A23",

                    fontSize:
                      "0.78rem",

                    fontWeight:
                      700,
                  }}

                >

                  {isAdminSent
                    ? "Admin"
                    : msg.sender_name}

                </p>


                {isAdminSent && (

                  <span

                    className="px-1.5 py-0.5 rounded"

                    style={{

                      background:
                        "rgba(184,155,94,0.18)",

                      color:
                        "#B89B5E",

                      fontFamily:
                        "JetBrains Mono, monospace",

                      fontSize:
                        "0.5rem",

                      fontWeight:
                        700,

                      letterSpacing:
                        "0.07em",
                    }}

                  >

                    ADMIN REPLY

                  </span>

                )}


                {isLatest && (

                  <span

                    className="px-1.5 py-0.5 rounded"

                    style={{

                      background:
                        "rgba(184,155,94,0.22)",

                      color:
                        "#A6874E",

                      fontFamily:
                        "JetBrains Mono, monospace",

                      fontSize:
                        "0.5rem",

                      fontWeight:
                        700,

                      letterSpacing:
                        "0.07em",

                      border:
                        "1px solid rgba(184,155,94,0.35)",
                    }}

                  >

                    ★ LATEST

                  </span>

                )}

              </div>


              <span

                style={{

                  fontFamily:
                    "JetBrains Mono, monospace",

                  fontSize:
                    "0.61rem",

                  color:
                    "#A89B91",

                  flexShrink: 0,
                }}

              >

                {formatDate(
                  msg.timestamp
                )}

              </span>

            </div>


            <p

              style={{

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.64rem",

                color:
                  "#7A6D63",
              }}

            >

              <span
                style={{
                  color: "#DCCFC0",
                }}
              >
                From:
              </span>{" "}

              {msg.sender_email}

            </p>


            <p

              style={{

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.64rem",

                color:
                  "#7A6D63",
              }}

            >

              <span
                style={{
                  color: "#DCCFC0",
                }}
              >
                To:
              </span>{" "}

              {msg.receiver_name}

              {" <"}

              {msg.receiver_email}

              {">"}

            </p>

          </div>

        </div>


        {/* BADGES */}

        <div className="flex flex-wrap items-center gap-2 px-5 pt-3.5 pb-1">

          {msg.is_encrypted && (

            <span

              className="flex items-center gap-1 px-2 py-0.5 rounded-full"

              style={{

                background:
                  "rgba(0,170,85,0.08)",

                border:
                  "1px solid rgba(0,170,85,0.18)",

                color:
                  "#00aa55",

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.54rem",

                fontWeight:
                  600,
              }}

            >

              <Lock size={8} />

              Encrypted

            </span>

          )}


          {msg.is_verified && (

            <span

              className="flex items-center gap-1 px-2 py-0.5 rounded-full"

              style={{

                background:
                  "rgba(184,155,94,0.1)",

                border:
                  "1px solid rgba(184,155,94,0.22)",

                color:
                  "#B89B5E",

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.54rem",

                fontWeight:
                  600,
              }}

            >

              <CheckCircle size={8} />

              Verified

            </span>

          )}


          <span

            className="flex items-center gap-1 px-2 py-0.5 rounded-full"

            style={{

              background:
                "rgba(59,42,35,0.06)",

              border:
                "1px solid rgba(59,42,35,0.12)",

              color:
                "#3B2A23",

              fontFamily:
                "JetBrains Mono, monospace",

              fontSize:
                "0.54rem",

              fontWeight:
                600,
            }}

          >

            <Shield size={8} />

            Quantum Secure

          </span>

        </div>


        {/* BODY */}

        <div className="px-5 py-4">

          <p

            style={{

              fontSize:
                "0.84rem",

              color:
                "#3B2A23",

              lineHeight:
                1.8,

              whiteSpace:
                "pre-wrap",
            }}

          >

            {msg.body}

          </p>

        </div>


        {/* ATTACHMENTS */}

        {msg.attachments.length > 0 && (

          <div

            className="px-5 pb-4"

            style={{

              borderTop:
                "1px solid #E6DDD2",

              paddingTop: 12,
            }}

          >

            <p

              style={{

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.58rem",

                color:
                  "#A89B91",

                letterSpacing:
                  "0.07em",

                textTransform:
                  "uppercase",

                marginBottom: 8,
              }}

            >

              Attachments

            </p>


            <div className="flex flex-wrap gap-2">

              {msg.attachments.map(
                (att, i) => (

                  <div

                    key={i}

                    className="flex items-center gap-2 px-3 py-2 rounded-xl"

                    style={{

                      background:
                        "rgba(184,155,94,0.07)",

                      border:
                        "1px solid rgba(184,155,94,0.2)",
                    }}

                  >

                    <Paperclip
                      size={11}
                      style={{
                        color: "#B89B5E",
                      }}
                    />

                    <span

                      style={{

                        fontFamily:
                          "JetBrains Mono, monospace",

                        fontSize:
                          "0.65rem",

                        color:
                          "#3B2A23",
                      }}

                    >

                      {att.name}

                    </span>


                    <span

                      style={{

                        fontFamily:
                          "JetBrains Mono, monospace",

                        fontSize:
                          "0.58rem",

                        color:
                          "#A89B91",
                      }}

                    >

                      {att.size}

                    </span>

                  </div>

                )
              )}

            </div>

          </div>

        )}


        {/* REPLY BUTTON */}

        {showReplyButton &&
          !showReply && (

            <div
              className="px-5 pb-4 pt-1"
            >

              <button

                onClick={() =>
                  setShowReply(true)
                }

                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-150 hover:scale-105"

                style={{

                  background:
                    "rgba(184,155,94,0.08)",

                  border:
                    "1px solid rgba(184,155,94,0.22)",

                  color:
                    "#B89B5E",

                  fontFamily:
                    "Orbitron, sans-serif",

                  fontSize:
                    "0.58rem",

                  fontWeight:
                    700,

                  letterSpacing:
                    "0.08em",
                }}

              >

                <CornerDownLeft
                  size={12}
                />

                REPLY

              </button>

            </div>

          )}

      </div>


      {/* =====================================================
          REPLY FORM
      ===================================================== */}

      {showReplyButton &&
        showReply && (

          <div

            className="mt-2 rounded-2xl overflow-hidden"

            style={{

              background:
                "#FFFDF9",

              border:
                "1.5px solid rgba(184,155,94,0.35)",

              boxShadow:
                "0 4px 18px rgba(184,155,94,0.1)",
            }}

          >

            {/* REPLY TO */}

            <div

              className="flex items-center gap-2 px-4 py-2.5"

              style={{

                background:
                  "rgba(184,155,94,0.06)",

                borderBottom:
                  "1px solid rgba(184,155,94,0.15)",
              }}

            >

              <CornerDownLeft
                size={11}
                style={{
                  color: "#B89B5E",
                }}
              />

              <span

                style={{

                  fontFamily:
                    "JetBrains Mono, monospace",

                  fontSize:
                    "0.6rem",

                  color:
                    "#7A6D63",
                }}

              >

                Replying to{" "}

                <span

                  style={{

                    color:
                      "#3B2A23",

                    fontWeight:
                      700,
                  }}

                >

                  {msg.sender_name}

                </span>

                {" <"}

                {msg.sender_email}

                {">"}

              </span>

            </div>


            {/* TEXTAREA */}

            <textarea

              value={replyText}

              onChange={(e) =>
                setReplyText(
                  e.target.value
                )
              }

              placeholder="Type your reply…"

              rows={3}

              autoFocus

              className="w-full px-4 py-3 resize-none outline-none"

              style={{

                background:
                  "transparent",

                color:
                  "#3B2A23",

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.82rem",

                lineHeight:
                  1.7,

                borderBottom:
                  "1px solid #E6DDD2",
              }}

            />


            {/* FILE */}

            {selectedFile && (

              <div

                className="flex items-center gap-2 px-4 py-2"

                style={{

                  borderBottom:
                    "1px solid #E6DDD2",
                }}

              >

                <Paperclip
                  size={11}
                  style={{
                    color:
                      "#B89B5E",
                  }}
                />

                <span

                  className="truncate"

                  style={{

                    fontFamily:
                      "JetBrains Mono, monospace",

                    fontSize:
                      "0.65rem",

                    color:
                      "#3B2A23",
                  }}

                >

                  {selectedFile.name}

                </span>


                <button

                  onClick={() =>
                    setSelectedFile(
                      null
                    )
                  }

                >

                  <X

                    size={11}

                    style={{
                      color:
                        "#A89B91",
                    }}

                  />

                </button>

              </div>

            )}


            {/* QUANTUM */}

            <div

              className="flex items-center gap-1.5 px-4 py-2"

              style={{

                borderBottom:
                  "1px solid #E6DDD2",

                background:
                  "rgba(59,42,35,0.03)",
              }}

            >

              <Shield
                size={10}
                style={{
                  color:
                    "#B89B5E",
                }}
              />

              <span

                style={{

                  fontFamily:
                    "JetBrains Mono, monospace",

                  fontSize:
                    "0.58rem",

                  color:
                    "#7A6D63",
                }}

              >

                Quantum Encryption Enabled

              </span>

            </div>


            {/* ACTION BAR */}

            <div className="flex items-center gap-2 px-4 py-3">

              <input

                ref={fileRef}

                type="file"

                className="hidden"

                onChange={(e) => {

                  const file =
                    e.target.files?.[0];

                  if (file) {
                    setSelectedFile(
                      file
                    );
                  }

                }}

              />


              <button

                onClick={() =>
                  fileRef.current?.click()
                }

                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:scale-110"

                style={{

                  background:
                    "rgba(204,0,0,0.08)",

                  border:
                    "1px solid rgba(204,0,0,0.2)",

                  color:
                    "#cc0000",
                }}

                title="Attach file"

              >

                <Paperclip
                  size={14}
                />

              </button>


              <div className="flex-1" />


              <button

                onClick={
                  handleCancel
                }

                className="px-3 py-1.5 rounded-xl transition-all duration-150 hover:scale-105"

                style={{

                  background:
                    "rgba(59,42,35,0.06)",

                  border:
                    "1px solid #E6DDD2",

                  color:
                    "#7A6D63",

                  fontFamily:
                    "Orbitron, sans-serif",

                  fontSize:
                    "0.57rem",

                  letterSpacing:
                    "0.08em",
                }}

              >

                CANCEL

              </button>


              <button

                onClick={
                  handleSend
                }

                disabled={
                  !replyText.trim()
                }

                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition-all duration-150 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"

                style={{

                  background:

                    replyText.trim()

                      ? "linear-gradient(135deg,#B89B5E,#A6874E)"

                      : "rgba(184,155,94,0.2)",

                  color:
                    "#FAF3E7",

                  fontFamily:
                    "Orbitron, sans-serif",

                  fontSize:
                    "0.57rem",

                  letterSpacing:
                    "0.08em",

                  fontWeight:
                    700,
                }}

              >

                <Send
                  size={12}
                />

                SEND REPLY

              </button>

            </div>

          </div>

        )}

    </div>
  );
}


// =========================================================
// MAIN PAGE
// =========================================================

export default function AdminMails() {

  const navigate =
    useNavigate();


  const [search, setSearch] =
    useState("");


  const [activeConv, setActiveConv] =
    useState<Conversation | null>(
      null
    );


  const [emails, setEmails] =
    useState<EmailMessage[]>([]);


  const [latestReplyId, setLatestReplyId] =
    useState<number | null>(
      null
    );


  const [loading, setLoading] =
    useState(true);


  const [sendingReply, setSendingReply] =
    useState(false);


  const [error, setError] =
    useState<string | null>(
      null
    );


  // =======================================================
  // GET JWT TOKEN
  // =======================================================

  function getAccessToken() {

    return (

      localStorage.getItem(
        "access"
      ) ||

      localStorage.getItem(
        "access_token"
      ) ||

      localStorage.getItem(
        "token"
      ) ||

      ""
    );
  }


  // =======================================================
  // FETCH ALL ADMIN MAILS
  // =======================================================

  async function fetchAdminMails() {

    try {

      setLoading(true);

      setError(null);


      const token =
        getAccessToken();


      if (!token) {

        throw new Error(
          "Authentication token not found"
        );

      }


      const response =
        await fetch(
          `${API_BASE_URL}/adminmails/`,
          {
            method: "GET",

            headers: {

              "Authorization":
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data?.error ||
          "Failed to load emails"
        );

      }


      const converted:
        EmailMessage[] =
        data.map(
          (mail: BackendMail) => {

            const isAdminSent =
              mail.sender ===
              "admin@qumail.io" ||
              mail.sender_name
                ?.toLowerCase()
                .includes("admin");


            return {

              id:
                mail.id,

              sender_name:
                mail.sender_name ||
                mail.sender,

              sender_email:
                mail.sender,

              receiver_name:
                mail.receiver_name ||
                mail.receiver,

              receiver_email:
                mail.receiver,

              subject:
                mail.subject ||
                "(No Subject)",

              body:
                mail.message || "",

              timestamp:
                mail.created_at,

              attachments:
                mail.hasAttachment

                  ? [
                      {
                        name:
                          "Encrypted Attachment",

                        size:
                          "Secure File",
                      },
                    ]

                  : [],

              is_encrypted:
                true,

              is_verified:
                true,

              is_read:
                mail.is_read,

              isAdminSent,
            };
          }
        );


      setEmails(
        converted
      );


      // ===================================================
      // KEEP CURRENT CONVERSATION UPDATED
      // ===================================================

      if (activeConv) {

        const updatedConversations =
          groupIntoConversations(
            converted
          );


        const updated =
          updatedConversations.find(
            (conversation) =>
              conversation.subject
                .trim()
                .toLowerCase() ===
              activeConv.subject
                .trim()
                .toLowerCase()
          );


        if (updated) {

          setActiveConv(
            updated
          );

        }

      }

    }

    catch (err) {

      console.error(
        "ADMIN MAIL FETCH ERROR:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Failed to load emails"
      );

    }

    finally {

      setLoading(false);

    }
  }


  // =======================================================
  // OPEN ADMIN CONVERSATION + MARK UNREAD MAILS AS READ
  // =======================================================

  async function openAdminConversation(
    conv: Conversation
  ) {

    try {

      const token =
        getAccessToken();


      if (!token) {

        throw new Error(
          "Authentication token not found"
        );

      }


      // Get only unread mails received by admin
      const unreadMessages =
        conv.messages.filter(
          (msg) =>
            !msg.is_read &&
            !msg.isAdminSent
        );


      // Mark every unread received mail as read
      await Promise.all(
        unreadMessages.map(
          async (msg) => {

            const response =
              await fetch(
                `${API_BASE_URL}/adminmarkread/${msg.id}/`,
                {
                  method: "POST",

                  headers: {
                    Authorization:
                      `Bearer ${token}`,

                    "Content-Type":
                      "application/json",
                  },
                }
              );


            if (!response.ok) {

              const data =
                await response.json().catch(
                  () => ({})
                );


              throw new Error(
                data?.error ||
                `Failed to mark mail ${msg.id} as read`
              );

            }

          }
        )
      );


      // Open the conversation
      setActiveConv(
        conv
      );


      // Fetch again so the dashboard gets the updated is_read values
      await fetchAdminMails();

    }

    catch (error) {

      console.error(
        "OPEN ADMIN CONVERSATION ERROR:",
        error
      );


      // Even if marking read fails, still open the conversation
      setActiveConv(
        conv
      );

    }

  }


  // =======================================================
  // LOAD MAILS WHEN PAGE OPENS
  // =======================================================

  useEffect(() => {

    fetchAdminMails();

  }, []);


  // =======================================================
  // CONVERSATIONS
  // =======================================================

  const conversations =
    groupIntoConversations(
      emails
    );


  // =======================================================
  // SEARCH
  // =======================================================

  const filtered =
    conversations.filter(
      (c) => {

        const q =
          search
            .toLowerCase()
            .trim();


        if (!q) {
          return true;
        }


        return (

          c.subject
            .toLowerCase()
            .includes(q)

          ||

          c.participants.some(
            (p) =>
              p
                .toLowerCase()
                .includes(q)
          )

          ||

          c.participant_emails.some(
            (e) =>
              e
                .toLowerCase()
                .includes(q)
          )

        );
      }
    );


  // =======================================================
  // UNIQUE USERS
  // =======================================================

  const uniqueUsers =
    new Set(
      emails.flatMap(
        (email) => [
          email.sender_email,
          email.receiver_email,
        ]
      )
    ).size;


  // =======================================================
  // ACTIVE CONVERSATION MESSAGES
  // =======================================================

  const allMessages =
    activeConv
      ? activeConv.messages
      : [];


  const lastMsg =
    allMessages[
      allMessages.length - 1
    ] ?? null;


  // =======================================================
  // SEND ADMIN REPLY
  // =======================================================

  async function handleAdminReply(

    replyingToMsg:
      EmailMessage,

    text:
      string,

    file:
      File | null

  ) {

    if (!text.trim()) {
      return;
    }


    if (sendingReply) {
      return;
    }


    try {

      setSendingReply(
        true
      );

      setError(null);


      const token =
        getAccessToken();


      if (!token) {

        throw new Error(
          "Authentication token not found"
        );

      }


      // =================================================
      // FORM DATA
      // =================================================

      const formData =
        new FormData();


      formData.append(
        "message",
        text
      );


      if (file) {

        formData.append(
          "attachment",
          file
        );

      }


      // =================================================
      // SEND TO DJANGO
      // =================================================

      const response =
        await fetch(

          `${API_BASE_URL}/adminreply/${replyingToMsg.id}/`,

          {

            method:
              "POST",

            headers: {

              "Authorization":
                `Bearer ${token}`,
            },

            body:
              formData,
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data?.error ||
          "Failed to send reply"
        );

      }


      // =================================================
      // SAVE NEW REPLY ID
      // =================================================

      if (data?.mail?.id) {

        setLatestReplyId(
          data.mail.id
        );

      }


      // =================================================
      // RELOAD FROM DATABASE
      // =================================================

      await fetchAdminMails();

    }

    catch (err) {

      console.error(
        "ADMIN REPLY ERROR:",
        err
      );


      setError(
        err instanceof Error

          ? err.message

          : "Failed to send reply"
      );

    }

    finally {

      setSendingReply(
        false
      );

    }
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div

      className="min-h-screen flex flex-col"

      style={{
        background:
          "#FAF3E7",
      }}

    >


      {/* =================================================
          HEADER
      ================================================= */}

      <header

        className="sticky top-0 z-40 flex items-center gap-3 px-4 h-16"

        style={{

          background:
            "rgba(59,42,35,0.92)",

          backdropFilter:
            "blur(22px)",

          WebkitBackdropFilter:
            "blur(22px)",

          borderBottom:
            "1px solid rgba(184,155,94,0.18)",

          boxShadow:
            "0 4px 24px rgba(59,42,35,0.18)",
        }}

      >

        <button

          onClick={() => {

            if (activeConv) {

              setActiveConv(
                null
              );

              return;

            }


            navigate(
              "/admin-dashboard"
            );

          }}

          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 flex-shrink-0"

          style={{

            background:
              "rgba(184,155,94,0.15)",

            border:
              "1px solid rgba(184,155,94,0.35)",

            color:
              "#B89B5E",
          }}

        >

          <ArrowLeft
            size={16}
          />

        </button>


        <div className="flex-1 min-w-0">

          <p

            className="truncate"

            style={{

              fontFamily:
                "Orbitron, sans-serif",

              color:
                "#FAF3E7",

              fontSize:
                "0.92rem",

              fontWeight:
                700,

              letterSpacing:
                "0.05em",
            }}

          >

            {activeConv
              ? activeConv.subject
              : "All Mails"}

          </p>


          <p

            style={{

              fontSize:
                "0.61rem",

              color:
                "rgba(250,243,231,0.5)",

              fontFamily:
                "JetBrains Mono, monospace",
            }}

          >

            {activeConv

              ? `${allMessages.length} message${
                  allMessages.length !== 1
                    ? "s"
                    : ""
                } · ${activeConv.participants.join(", ")}`

              : `${filtered.length} conversation${
                  filtered.length !== 1
                    ? "s"
                    : ""
                } · Admin View`}

          </p>

        </div>


        <div

          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"

          style={{

            background:
              "rgba(184,155,94,0.12)",

            border:
              "1px solid rgba(184,155,94,0.28)",
          }}

        >

          <Shield
            size={11}
            style={{
              color:
                "#B89B5E",
            }}
          />


          <span

            style={{

              fontFamily:
                "JetBrains Mono, monospace",

              fontSize:
                "0.54rem",

              color:
                "#B89B5E",

              fontWeight:
                700,

              letterSpacing:
                "0.07em",
            }}

          >

            ADMIN

          </span>

        </div>

      </header>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div

          className="mx-auto mt-4 w-full max-w-2xl px-4"

        >

          <div

            className="rounded-xl px-4 py-3"

            style={{

              background:
                "rgba(204,0,0,0.06)",

              border:
                "1px solid rgba(204,0,0,0.18)",

              color:
                "#a00000",

              fontFamily:
                "JetBrains Mono, monospace",

              fontSize:
                "0.68rem",
            }}

          >

            {error}

          </div>

        </div>

      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <main className="flex-1 flex items-center justify-center">

          <div className="flex flex-col items-center gap-3">

            <div

              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"

              style={{

                borderColor:
                  "#B89B5E",

                borderTopColor:
                  "transparent",
              }}

            />


            <p

              style={{

                fontFamily:
                  "JetBrains Mono, monospace",

                color:
                  "#A89B91",

                fontSize:
                  "0.7rem",
              }}

            >

              Loading secure mails...

            </p>

          </div>

        </main>

      ) : activeConv ? (

        /* =================================================
           THREAD VIEW
        ================================================= */

        <main className="flex-1 overflow-y-auto">

          <div

            className="max-w-2xl mx-auto px-4 py-6 pb-14 space-y-1"

          >


            {/* THREAD HEADER */}

            <div

              className="rounded-2xl px-5 py-4 mb-6"

              style={{

                background:
                  "#FFFDF9",

                border:
                  "1px solid #E6DDD2",
              }}

            >

              <p

                style={{

                  fontFamily:
                    "Orbitron, sans-serif",

                  color:
                    "#3B2A23",

                  fontSize:
                    "0.88rem",

                  fontWeight:
                    800,

                  marginBottom:
                    10,
                }}

              >

                {activeConv.subject}

              </p>


              <div className="flex flex-wrap gap-2">

                {activeConv.participants.map(

                  (name, i) => (

                    <div

                      key={i}

                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"

                      style={{

                        background:
                          "rgba(59,42,35,0.04)",

                        border:
                          "1px solid #E6DDD2",
                      }}

                    >

                      <div

                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"

                        style={{

                          background:
                            av(i).bg,

                          color:
                            av(i).color,

                          fontFamily:
                            "Orbitron, sans-serif",

                          fontSize:
                            "0.44rem",

                          fontWeight:
                            800,
                        }}

                      >

                        {initials(
                          name
                        )}

                      </div>


                      <span

                        style={{

                          fontSize:
                            "0.7rem",

                          color:
                            "#3B2A23",

                          fontFamily:
                            "JetBrains Mono, monospace",
                        }}

                      >

                        {name}

                      </span>


                      <span

                        style={{

                          fontSize:
                            "0.63rem",

                          color:
                            "#A89B91",

                          fontFamily:
                            "JetBrains Mono, monospace",
                        }}

                      >

                        &lt;

                        {
                          activeConv
                            .participant_emails[
                              i
                            ]
                        }

                        &gt;

                      </span>

                    </div>

                  )

                )}

              </div>

            </div>


            {/* =================================================
                MESSAGES
            ================================================= */}

            {allMessages.map(

              (msg, i) => {

                const isAdminSent =
                  !!msg.isAdminSent;


                const isLatest =
                  latestReplyId !== null &&
                  msg.id ===
                    latestReplyId;


                const isLastInThread =
                  lastMsg !== null &&
                  msg.id ===
                    lastMsg.id;


                const showReplyButton =
                  isLastInThread;


                return (

                  <div
                    key={msg.id}
                  >

                    <MessageBubble

                      msg={msg}

                      idx={i}

                      isAdminSent={
                        isAdminSent
                      }

                      isLatest={
                        isLatest
                      }

                      showReplyButton={
                        showReplyButton
                      }

                      onReply={(
                        text,
                        file
                      ) =>
                        handleAdminReply(
                          msg,
                          text,
                          file
                        )
                      }

                    />


                    {i <
                      allMessages.length -
                        1 && (

                      <div

                        className="flex items-center gap-3 my-3 px-8"

                      >

                        <div

                          style={{

                            flex: 1,

                            height: 1,

                            background:
                              "#E6DDD2",
                          }}

                        />


                        <span

                          style={{

                            fontFamily:
                              "JetBrains Mono, monospace",

                            fontSize:
                              "0.57rem",

                            color:
                              "#DCCFC0",

                            letterSpacing:
                              "0.07em",
                          }}

                        >

                          ↓

                        </span>


                        <div

                          style={{

                            flex: 1,

                            height: 1,

                            background:
                              "#E6DDD2",
                          }}

                        />

                      </div>

                    )}

                  </div>

                );

              }

            )}

          </div>

        </main>

      ) : (

        /* =================================================
           CONVERSATION LIST
        ================================================= */

        <main className="flex-1 overflow-y-auto">

          <div

            className="max-w-2xl mx-auto px-4 py-5 pb-14"

          >


            {/* SEARCH */}

            <div
              className="relative mb-4"
            >

              <Search

                size={14}

                className="absolute left-3.5 top-1/2 -translate-y-1/2"

                style={{
                  color:
                    "#A89B91",
                }}

              />


              <input

                type="text"

                placeholder="Search by subject, name or email…"

                value={search}

                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }

                className="w-full pl-10 pr-9 py-3 rounded-2xl outline-none"

                style={{

                  background:
                    "#FFFDF9",

                  border:
                    "1px solid #E6DDD2",

                  color:
                    "#3B2A23",

                  fontFamily:
                    "JetBrains Mono, monospace",

                  fontSize:
                    "0.78rem",
                }}

              />


              {search && (

                <button

                  onClick={() =>
                    setSearch("")
                  }

                  className="absolute right-3.5 top-1/2 -translate-y-1/2"

                >

                  <X

                    size={13}

                    style={{
                      color:
                        "#A89B91",
                    }}

                  />

                </button>

              )}

            </div>


            {/* STATS */}

            <div
              className="flex flex-wrap gap-3 mb-5"
            >

              {[

                {

                  label:
                    "Conversations",

                  value:
                    conversations.length,

                  icon:
                    <MessageSquare
                      size={11}
                    />,
                },

                {

                  label:
                    "Total Emails",

                  value:
                    emails.length,

                  icon:
                    <Mail
                      size={11}
                    />,
                },

                {

                  label:
                    "Users Involved",

                  value:
                    uniqueUsers,

                  icon:
                    <User
                      size={11}
                    />,
                },

              ].map((s) => (

                <div

                  key={s.label}

                  className="flex items-center gap-2 px-3 py-2 rounded-xl"

                  style={{

                    background:
                      "#FFFDF9",

                    border:
                      "1px solid #E6DDD2",
                  }}

                >

                  <span

                    style={{
                      color:
                        "#B89B5E",
                    }}

                  >

                    {s.icon}

                  </span>


                  <span

                    style={{

                      fontFamily:
                        "Orbitron, sans-serif",

                      color:
                        "#3B2A23",

                      fontSize:
                        "0.78rem",

                      fontWeight:
                        800,
                    }}

                  >

                    {s.value}

                  </span>


                  <span

                    style={{

                      fontFamily:
                        "JetBrains Mono, monospace",

                      color:
                        "#A89B91",

                      fontSize:
                        "0.6rem",
                    }}

                  >

                    {s.label}

                  </span>

                </div>

              ))}

            </div>


            {/* EMPTY */}

            {filtered.length === 0 && (

              <div

                className="flex flex-col items-center py-20 gap-3"

              >

                <div

                  className="w-14 h-14 rounded-2xl flex items-center justify-center"

                  style={{

                    background:
                      "rgba(184,155,94,0.1)",

                    border:
                      "1px solid rgba(184,155,94,0.2)",
                  }}

                >

                  <Mail

                    size={24}

                    style={{
                      color:
                        "#B89B5E",
                    }}

                  />

                </div>


                <p

                  style={{

                    fontFamily:
                      "Orbitron, sans-serif",

                    color:
                      "#3B2A23",

                    fontSize:
                      "0.82rem",

                    fontWeight:
                      700,
                  }}

                >

                  No conversations found

                </p>


                <p

                  style={{

                    fontFamily:
                      "JetBrains Mono, monospace",

                    color:
                      "#A89B91",

                    fontSize:
                      "0.7rem",
                  }}

                >

                  Try a different search term

                </p>

              </div>

            )}


            {/* LIST */}

            <div className="space-y-3">

              {filtered.map(
                (conv) => (

                  <ConversationCard

                    key={
                      conv.subject
                    }

                    conv={conv}

                    onClick={() =>
                      openAdminConversation(
                        conv
                      )
                    }

                  />

                )
              )}

            </div>

          </div>

        </main>

      )}

    </div>
  );
}
