import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Shield,
  Bell,
  AlertTriangle,
  AlertCircle,
  Lock,
  UserPlus,
  Key,
  CheckCheck,
  Check,
  RefreshCw,
  Filter,
  Clock,
} from "lucide-react";


// ============================================================
// TYPES
// ============================================================

type NotifType =
  | "login_failed"
  | "account_locked"
  | "new_user"
  | "password_reset"
  | "suspicious_activity";

type Severity =
  | "info"
  | "warning"
  | "critical";

type FilterTab =
  | "all"
  | "unread"
  | "critical";


// ============================================================
// FRONTEND NOTIFICATION TYPE
// ============================================================

interface Notification {

  id: number;

  user_id?: number;

  type: NotifType;

  severity: Severity;

  title: string;

  message: string;

  timestamp: string;

  is_read: boolean;

  user_email?: string;
}


// ============================================================
// BACKEND RESPONSE TYPE
// ============================================================

interface BackendNotification {

  id: number;

  user_id: number;

  username: string;

  message: string;

  type: string;

  is_read: boolean;

  created_at: string;
}


// ============================================================
// HELPERS
// ============================================================

function formatDate(ts: string) {

  return new Date(ts).toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function formatTime(ts: string) {

  return new Date(ts).toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
}


function timeAgo(ts: string) {

  const diff =
    Date.now() -
    new Date(ts).getTime();

  const mins =
    Math.floor(diff / 60000);

  if (mins < 1) {
    return "Just now";
  }

  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hrs =
    Math.floor(mins / 60);

  if (hrs < 24) {
    return `${hrs}h ago`;
  }

  return `${Math.floor(hrs / 24)}d ago`;
}


// ============================================================
// TYPE METADATA
// ============================================================

const TYPE_META: Record<
  NotifType,
  {
    icon: React.ReactNode;
    label: string;
  }
> = {

  login_failed: {
    icon: <AlertTriangle size={14} />,
    label: "Login Failure",
  },

  account_locked: {
    icon: <Lock size={14} />,
    label: "Account Locked",
  },

  new_user: {
    icon: <UserPlus size={14} />,
    label: "New User",
  },

  password_reset: {
    icon: <Key size={14} />,
    label: "Password Reset",
  },

  suspicious_activity: {
    icon: <AlertCircle size={14} />,
    label: "Suspicious Activity",
  },
};


// ============================================================
// SEVERITY STYLES
// ============================================================

const SEV: Record<
  Severity,
  {
    dot: string;
    bg: string;
    border: string;
    text: string;
    iconColor: string;
  }
> = {

  critical: {

    dot: "#cc0000",

    bg: "rgba(204,0,0,0.05)",

    border: "rgba(204,0,0,0.18)",

    text: "#cc0000",

    iconColor: "#cc0000",
  },

  warning: {

    dot: "#E8A838",

    bg: "rgba(232,168,56,0.06)",

    border: "rgba(232,168,56,0.22)",

    text: "#C07A00",

    iconColor: "#E8A838",
  },

  info: {

    dot: "#B89B5E",

    bg: "rgba(184,155,94,0.05)",

    border: "rgba(184,155,94,0.2)",

    text: "#B89B5E",

    iconColor: "#B89B5E",
  },
};


// ============================================================
// FILTER TABS
// ============================================================

const TABS: {
  key: FilterTab;
  label: string;
}[] = [

  {
    key: "all",
    label: "All",
  },

  {
    key: "unread",
    label: "Unread",
  },

  {
    key: "critical",
    label: "Critical",
  },
];


// ============================================================
// COMPONENT
// ============================================================

export default function AdminNotifications() {

  const navigate =
    useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    activeTab,
    setActiveTab,
  ] = useState<FilterTab>("all");


  const [
    readIds,
    setReadIds,
  ] = useState<Set<number>>(
    new Set()
  );


  // ==========================================================
  // GET TOKEN
  // ==========================================================

  const getToken = () => {

    return (
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      ""
    );
  };


  // ==========================================================
  // FETCH NOTIFICATIONS
  // ==========================================================

  const fetchNotifications = async () => {

    const token = getToken();

    setLoading(true);

    try {

      const response =
        await fetch(
          "http://127.0.0.1:8000/admin-notifications/",
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );


      if (!response.ok) {

        throw new Error(
          `Failed to load notifications: ${response.status}`
        );
      }


      const data:
        BackendNotification[] =
        await response.json();


      // ======================================================
      // CONVERT BACKEND DATA TO FRONTEND FORMAT
      // ======================================================

      const formatted:
        Notification[] =
        data.map(
          (notification) => {

            return {

              id:
                notification.id,

              user_id:
                notification.user_id,

              type:
                "account_locked",

              severity:
                "critical",

              title:
                "Account Locked",

              message:
                notification.message,

              timestamp:
                notification.created_at,

              is_read:
                notification.is_read,

              user_email:
                notification.username,
            };
          }
        );


      setNotifications(
        formatted
      );


      // ======================================================
      // SET READ IDS
      // ======================================================

      setReadIds(

        new Set(

          formatted

            .filter(
              (notification) =>
                notification.is_read
            )

            .map(
              (notification) =>
                notification.id
            )
        )
      );

    } catch (error) {

      console.error(
        "Load notifications error:",
        error
      );

      // IMPORTANT:
      // Do not use mock data during testing.
      setNotifications([]);

      setReadIds(
        new Set()
      );

    } finally {

      setLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    fetchNotifications();

  }, []);


  // ==========================================================
  // MARK SINGLE NOTIFICATION AS READ
  // ==========================================================

  const markRead = async (
    id: number
  ) => {

    const token =
      getToken();


    try {

      const response =
        await fetch(
          `http://127.0.0.1:8000/admin-notifications/${id}/read/`,
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

        throw new Error(
          `Failed to mark notification as read: ${response.status}`
        );
      }


      // Update read IDs

      setReadIds(
        (previous) => {

          const updated =
            new Set(previous);

          updated.add(id);

          return updated;
        }
      );


      // Update notification itself

      setNotifications(
        (previous) =>

          previous.map(
            (notification) =>

              notification.id === id

                ? {
                    ...notification,
                    is_read: true,
                  }

                : notification
          )
      );

    } catch (error) {

      console.error(
        "Mark notification read error:",
        error
      );
    }
  };


  // ==========================================================
  // MARK ALL AS READ
  // ==========================================================

  const markAllRead =
    async () => {

      const token =
        getToken();


      try {

        const response =
          await fetch(
            "http://127.0.0.1:8000/admin-notifications/mark-all-read/",
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

          throw new Error(
            `Failed to mark all as read: ${response.status}`
          );
        }


        // Update all read IDs

        setReadIds(

          new Set(
            notifications.map(
              (notification) =>
                notification.id
            )
          )
        );


        // Update all notifications

        setNotifications(

          (previous) =>

            previous.map(
              (notification) => ({
                ...notification,

                is_read: true,
              })
            )
        );

      } catch (error) {

        console.error(
          "Mark all notifications read error:",
          error
        );
      }
    };


  // ==========================================================
  // CHECK READ STATUS
  // ==========================================================

  const isRead =
    (notification: Notification) => {

      return readIds.has(
        notification.id
      );
    };


  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const unread =
    notifications.filter(
      (notification) =>
        !isRead(notification)
    );


  const critical =
    notifications.filter(
      (notification) =>
        notification.severity ===
        "critical"
    );


  // ==========================================================
  // FILTERED NOTIFICATIONS
  // ==========================================================

  const filtered =

    activeTab === "unread"

      ? notifications.filter(
          (notification) =>
            !isRead(notification)
        )

      : activeTab === "critical"

      ? critical

      : notifications;


  // ==========================================================
  // COUNTS
  // ==========================================================

  const counts: Record<
    FilterTab,
    number
  > = {

    all:
      notifications.length,

    unread:
      unread.length,

    critical:
      critical.length,
  };


  const unreadCount =
    unread.length;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#FAF3E7",
      }}
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

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

        {/* Back */}

        <button
          onClick={() =>
            navigate("/admin-dashboard")
          }
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

          <ArrowLeft size={16} />

        </button>


        {/* Title */}

        <div
          className="flex-1 min-w-0"
        >

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
            Messages
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

            {unreadCount > 0

              ? `${unreadCount} unread notification${
                  unreadCount !== 1
                    ? "s"
                    : ""
                }`

              : "All caught up · Admin View"}

          </p>

        </div>


        {/* Unread */}

        {unreadCount > 0 && (

          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background:
                "rgba(204,0,0,0.15)",

              border:
                "1px solid rgba(204,0,0,0.3)",
            }}
          >

            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#cc0000",
                display: "inline-block",
                flexShrink: 0,
                boxShadow:
                  "0 0 6px #cc000099",
              }}
            />


            <span
              style={{
                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.54rem",

                color:
                  "#ff9d9d",

                fontWeight:
                  700,

                letterSpacing:
                  "0.06em",
              }}
            >

              {unreadCount} NEW

            </span>

          </span>
        )}


        {/* Admin badge */}

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


      {/* ====================================================
          MAIN
      ==================================================== */}

      <main
        className="flex-1 overflow-y-auto"
      >

        <div
          className="max-w-2xl mx-auto px-4 py-5 pb-14"
        >

          {/* ==================================================
              INTRO
          ================================================== */}

          <div
            className="mb-5 flex items-start justify-between"
          >

            <div>

              <p
                style={{
                  fontFamily:
                    "Orbitron, sans-serif",

                  color:
                    "#3B2A23",

                  fontSize:
                    "1.05rem",

                  fontWeight:
                    800,

                  letterSpacing:
                    "0.04em",

                  marginBottom:
                    4,
                }}
              >
                System Messages
              </p>


              <p
                style={{
                  fontFamily:
                    "JetBrains Mono, monospace",

                  fontSize:
                    "0.7rem",

                  color:
                    "#7A6D63",
                }}
              >
                All system-generated notifications and security alerts
              </p>

            </div>


            {unreadCount > 0 && (

              <button
                onClick={
                  markAllRead
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-150 hover:scale-105 flex-shrink-0"
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
                    "0.55rem",

                  letterSpacing:
                    "0.07em",

                  fontWeight:
                    700,
                }}
              >

                <CheckCheck
                  size={12}
                />

                MARK ALL READ

              </button>
            )}

          </div>


          {/* ==================================================
              STATS
          ================================================== */}

          <div
            className="flex flex-wrap gap-3 mb-5"
          >

            {[
              {
                label:
                  "Total",

                value:
                  notifications.length,

                color:
                  "#B89B5E",
              },

              {
                label:
                  "Unread",

                value:
                  unreadCount,

                color:
                  unreadCount > 0
                    ? "#cc0000"
                    : "#00aa55",
              },

              {
                label:
                  "Critical",

                value:
                  critical.length,

                color:
                  critical.length > 0
                    ? "#cc0000"
                    : "#A89B91",
              },

            ].map(
              (stat) => (

                <div
                  key={
                    stat.label
                  }
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
                  style={{
                    background:
                      "#FFFDF9",

                    border:
                      "1px solid #E6DDD2",
                  }}
                >

                  <span
                    style={{
                      fontFamily:
                        "Orbitron, sans-serif",

                      color:
                        stat.color,

                      fontSize:
                        "0.92rem",

                      fontWeight:
                        800,
                    }}
                  >
                    {stat.value}
                  </span>


                  <span
                    style={{
                      fontFamily:
                        "JetBrains Mono, monospace",

                      color:
                        "#A89B91",

                      fontSize:
                        "0.59rem",
                    }}
                  >
                    {stat.label}
                  </span>

                </div>

              )
            )}

          </div>


          {/* ==================================================
              FILTER TABS
          ================================================== */}

          <div
            className="flex gap-1 p-1 rounded-xl mb-5"
            style={{
              background:
                "#FFFDF9",

              border:
                "1px solid #E6DDD2",
            }}
          >

            {TABS.map(
              (tab) => {

                const active =
                  activeTab ===
                  tab.key;


                return (

                  <button
                    key={
                      tab.key
                    }
                    onClick={() =>
                      setActiveTab(
                        tab.key
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-150"
                    style={{
                      background:
                        active
                          ? "#3B2A23"
                          : "transparent",

                      color:
                        active
                          ? "#FAF3E7"
                          : "#7A6D63",

                      fontFamily:
                        "Orbitron, sans-serif",

                      fontSize:
                        "0.56rem",

                      fontWeight:
                        700,

                      letterSpacing:
                        "0.06em",
                    }}
                  >

                    <Filter
                      size={9}
                    />

                    {tab.label}


                    {counts[
                      tab.key
                    ] > 0 && (

                      <span
                        className="px-1.5 py-0.5 rounded-full"
                        style={{
                          background:
                            active
                              ? "rgba(184,155,94,0.25)"
                              : "rgba(59,42,35,0.08)",

                          color:
                            active
                              ? "#B89B5E"
                              : "#A89B91",

                          fontFamily:
                            "JetBrains Mono, monospace",

                          fontSize:
                            "0.52rem",

                          fontWeight:
                            700,
                        }}
                      >

                        {
                          counts[
                            tab.key
                          ]
                        }

                      </span>
                    )}

                  </button>
                );
              }
            )}

          </div>


          {/* ==================================================
              LOADING
          ================================================== */}

          {loading ? (

            <div
              className="flex flex-col items-center py-20 gap-3"
            >

              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "rgba(184,155,94,0.1)",

                  border:
                    "1px solid rgba(184,155,94,0.2)",
                }}
              >

                <RefreshCw
                  size={20}
                  style={{
                    color:
                      "#B89B5E",
                  }}
                  className="animate-spin"
                />

              </div>


              <p
                style={{
                  fontFamily:
                    "JetBrains Mono, monospace",

                  fontSize:
                    "0.72rem",

                  color:
                    "#A89B91",
                }}
              >
                Loading notifications…
              </p>

            </div>

          ) : filtered.length === 0 ? (

            /* ==================================================
               EMPTY
            ================================================== */

            <div
              className="flex flex-col items-center py-20 gap-3"
            >

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "rgba(0,170,85,0.08)",

                  border:
                    "1px solid rgba(0,170,85,0.18)",
                }}
              >

                <CheckCheck
                  size={24}
                  style={{
                    color:
                      "#00aa55",
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

                {activeTab ===
                "unread"
                  ? "All caught up!"
                  : "Nothing here"}

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

                {activeTab ===
                "unread"

                  ? "No unread notifications."

                  : "No notifications match this filter."}

              </p>

            </div>

          ) : (

            /* ==================================================
               NOTIFICATION LIST
            ================================================== */

            <div
              className="space-y-3"
            >

              {filtered.map(
                (notification) => {

                  const severity =
                    SEV[
                      notification.severity
                    ];

                  const meta =
                    TYPE_META[
                      notification.type
                    ];

                  const read =
                    isRead(
                      notification
                    );


                  return (

                    <div
                      key={
                        notification.id
                      }
                      className="rounded-2xl overflow-hidden"
                      style={{
                        background:
                          read
                            ? "#FFFDF9"
                            : severity.bg,

                        border:
                          read
                            ? "1px solid #E6DDD2"
                            : `1px solid ${severity.border}`,

                        boxShadow:
                          read
                            ? "0 1px 6px rgba(59,42,35,0.04)"
                            : "0 2px 14px rgba(59,42,35,0.06)",

                        opacity:
                          read
                            ? 0.82
                            : 1,
                      }}
                    >

                      {/* ====================================
                          TOP BAR
                      ==================================== */}

                      <div
                        className="flex items-center justify-between gap-3 px-4 py-3"
                        style={{
                          borderBottom:
                            `1px solid ${
                              read
                                ? "#E6DDD2"
                                : severity.border
                            }`,

                          background:
                            read
                              ? "rgba(59,42,35,0.02)"
                              : "rgba(204,0,0,0.05)",
                        }}
                      >

                        <div
                          className="flex items-center gap-2.5"
                        >

                          {/* Unread dot */}

                          {!read && (

                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius:
                                  "50%",

                                background:
                                  severity.dot,

                                display:
                                  "inline-block",

                                flexShrink:
                                  0,

                                boxShadow:
                                  `0 0 6px ${severity.dot}88`,
                              }}
                            />

                          )}


                          {/* Icon */}

                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              background:
                                read
                                  ? "rgba(59,42,35,0.05)"
                                  : "rgba(204,0,0,0.1)",

                              color:
                                read
                                  ? "#A89B91"
                                  : severity.iconColor,
                            }}
                          >

                            {meta.icon}

                          </span>


                          {/* Title */}

                          <p
                            style={{
                              fontFamily:
                                "Orbitron, sans-serif",

                              fontSize:
                                "0.72rem",

                              fontWeight:
                                700,

                              color:
                                read
                                  ? "#7A6D63"
                                  : "#3B2A23",
                            }}
                          >

                            {
                              notification.title
                            }

                          </p>

                        </div>


                        {/* Severity + time */}

                        <div
                          className="flex items-center gap-2 flex-shrink-0"
                        >

                          <span
                            className="px-2 py-0.5 rounded-full"
                            style={{
                              background:
                                read
                                  ? "rgba(59,42,35,0.05)"
                                  : severity.bg,

                              border:
                                `1px solid ${
                                  read
                                    ? "#E6DDD2"
                                    : severity.border
                                }`,

                              color:
                                read
                                  ? "#A89B91"
                                  : severity.text,

                              fontFamily:
                                "JetBrains Mono, monospace",

                              fontSize:
                                "0.5rem",

                              fontWeight:
                                700,

                              letterSpacing:
                                "0.06em",

                              textTransform:
                                "uppercase",
                            }}
                          >

                            {
                              meta.label
                            }

                          </span>


                          <span
                            style={{
                              fontFamily:
                                "JetBrains Mono, monospace",

                              fontSize:
                                "0.57rem",

                              color:
                                "#A89B91",
                            }}
                          >

                            {
                              timeAgo(
                                notification.timestamp
                              )
                            }

                          </span>

                        </div>

                      </div>


                      {/* ====================================
                          BODY
                      ==================================== */}

                      <div
                        className="px-4 py-3.5"
                      >

                        <p
                          style={{
                            fontFamily:
                              "JetBrains Mono, monospace",

                            fontSize:
                              "0.72rem",

                            color:
                              read
                                ? "#A89B91"
                                : "#3B2A23",

                            lineHeight:
                              1.75,

                            marginBottom:
                              notification.user_email
                                ? 10
                                : 0,
                          }}
                        >

                          {
                            notification.message
                          }

                        </p>


                        {/* ==================================
                            FOOTER
                        ================================== */}

                        <div
                          className="flex items-center justify-between gap-3 flex-wrap mt-2"
                        >

                          <div
                            className="flex items-center gap-2 flex-wrap"
                          >

                            {/* User */}

                            {notification.user_email && (

                              <span
                                className="px-2 py-0.5 rounded-lg"
                                style={{
                                  background:
                                    "rgba(184,155,94,0.08)",

                                  border:
                                    "1px solid rgba(184,155,94,0.2)",

                                  fontFamily:
                                    "JetBrains Mono, monospace",

                                  fontSize:
                                    "0.58rem",

                                  color:
                                    "#B89B5E",
                                }}
                              >

                                {
                                  notification.user_email
                                }

                              </span>

                            )}


                            {/* Date */}

                            <span
                              className="flex items-center gap-1"
                              style={{
                                fontFamily:
                                  "JetBrains Mono, monospace",

                                fontSize:
                                  "0.57rem",

                                color:
                                  "#A89B91",
                              }}
                            >

                              <Clock
                                size={9}
                              />

                              {
                                formatDate(
                                  notification.timestamp
                                )
                              }

                              {" · "}

                              {
                                formatTime(
                                  notification.timestamp
                                )
                              }

                            </span>

                          </div>


                          {/* Mark read */}

                          {!read && (

                            <button
                              onClick={() =>
                                markRead(
                                  notification.id
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 hover:scale-105"
                              style={{
                                background:
                                  "rgba(0,170,85,0.07)",

                                border:
                                  "1px solid rgba(0,170,85,0.2)",

                                color:
                                  "#00aa55",

                                fontFamily:
                                  "JetBrains Mono, monospace",

                                fontSize:
                                  "0.55rem",

                                fontWeight:
                                  700,
                              }}
                            >

                              <Check
                                size={10}
                              />

                              Mark read

                            </button>

                          )}


                          {/* Read */}

                          {read && (

                            <span
                              className="flex items-center gap-1"
                              style={{
                                fontFamily:
                                  "JetBrains Mono, monospace",

                                fontSize:
                                  "0.55rem",

                                color:
                                  "#DCCFC0",
                              }}
                            >

                              <Check
                                size={10}
                              />

                              Read

                            </span>

                          )}

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>

      </main>

    </div>
  );
}
