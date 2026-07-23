"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useCRMStore } from "@/lib/store/useCRMStore";
import type { Device, Call } from "@twilio/voice-sdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  Phone,
  MessageSquare,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck,
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  User as UserIcon,
  Volume2,
  PhoneOff,
  UserCheck,
  ChevronRight,
  X,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const {
    sidebarOpen,
    toggleSidebar,
    theme,
    setTheme,
    notifications,
    setNotifications,
    markNotificationRead,
    activeCall,
    answerCall,
    endCall,
    incomingCall,
    setIncomingCall,
    setUser,
  } = useCRMStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [clickedPath, setClickedPath] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sync / reset clicked path when route changes complete, and close the mobile drawer
  useEffect(() => {
    setClickedPath(null);
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleMarkAsRead = async (id: string) => {
    markNotificationRead(id);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { }
  };

  // Twilio Client browser device state
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  const [activeConnection, setActiveConnection] = useState<Call | null>(null);
  const callTriggeredRef = useRef<string | null>(null);

  // Auth Guard: Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      const user = session.user as { id?: string; role?: string; tenantId?: string };
      setUser({
        id: user.id || "user-admin",
        name: session.user.name || "Default User",
        email: session.user.email || "user@enterprise.com",
        role: user.role || "ADMIN",
        tenantId: user.tenantId || "tenant-1",
      });
    }
  }, [status, session, router, setUser]);

  // Initialize Twilio WebRTC browser client device
  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined" || !session?.user) return;

    let deviceInstance: Device | null = null;

    fetch("/api/calls/token")
      .then((res) => res.json())
      .then(async (data) => {
        if (!data.success || !data.token) {
          console.warn("[Twilio Client] Failed to retrieve Voice Token:", data.error);
          return;
        }

        const { Device: TwilioDevice } = await import("@twilio/voice-sdk");
        const device = new TwilioDevice(data.token, {
          logLevel: "warn",
        });
        deviceInstance = device;

        device.on("registered", () => {
          console.log("[Twilio Client] Browser device registered successfully");
        });

        device.on("error", (error: { message: string }) => {
          console.error("[Twilio Client] Device error:", error.message);
        });

        device.on("incoming", (connection: Call) => {
          console.log("[Twilio Client] Incoming WebRTC call received");
          setActiveConnection(connection);
          setIncomingCall({
            leadId: "incoming-webrtc",
            leadName: "Incoming Customer (Web)",
            phone: connection.parameters.From || "Unknown Number",
          });

          connection.on("disconnect", () => {
            console.log("[Twilio Client] Incoming call disconnected");
            setActiveConnection(null);
            endCall();
          });
        });

        device.on("disconnect", () => {
          console.log("[Twilio Client] WebRTC Call disconnected");
          setActiveConnection(null);
          endCall();
        });

        await device.register();
        setTwilioDevice(device);
      })
      .catch((err) => {
        console.warn("[Twilio Client] WebRTC Device initialization error:", err);
      });

    return () => {
      if (deviceInstance) {
        deviceInstance.destroy();
      }
    };
  }, [status, session, endCall, setIncomingCall]);

  // Load realistic notifications
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setNotifications(json.data);
      })
      .catch(() => { });
  }, [status, setNotifications]);

  // Real-time Pusher WebSockets subscription
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const userId = (session.user as { id: string }).id;
    if (!userId) return;

    import("@/lib/pusher-client").then(({ pusherClient }) => {
      const channel = pusherClient.subscribe(`user-${userId}`);

      channel.bind("notification:created", (data: { title?: string; message?: string }) => {
        setNotifications([
          {
            id: `n-real-${Date.now()}`,
            title: data.title || "Real-time Notification",
            message: data.message || "",
            isRead: false,
            createdAt: "Just now",
          },
          ...notifications,
        ]);
      });

      channel.bind("call:incoming", (data: { leadId?: string; leadName?: string; phone?: string }) => {
        setIncomingCall({
          leadId: data.leadId || "lead-1",
          leadName: data.leadName || "Incoming Caller",
          phone: data.phone || "",
        });
      });
    });

    return () => {
      import("@/lib/pusher-client").then(({ pusherClient }) => {
        pusherClient.unsubscribe(`user-${userId}`);
      });
    };
  }, [status, session, setNotifications, setIncomingCall, notifications]);

  // Handle active call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall && activeCall.status === "connected") {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  // Trigger outbound call using Twilio WebRTC client or fallback to simulation
  useEffect(() => {
    if (!activeCall || activeCall.status === "ended" || activeCall.status === "idle") {
      callTriggeredRef.current = null;
      return;
    }

    if (activeCall.status === "ringing") {
      if (activeCall.isTriggered || callTriggeredRef.current === activeCall.leadId) {
        return;
      }

      callTriggeredRef.current = activeCall.leadId;

      useCRMStore.setState({
        activeCall: {
          ...activeCall,
          isTriggered: true,
        },
      });

      if (twilioDevice) {
        console.log(`[Twilio Client] Outbound WebRTC call placing to: ${activeCall.phone}`);

        twilioDevice.connect({
          params: {
            To: activeCall.phone,
            leadId: activeCall.leadId,
          },
        }).then((connection: Call) => {
          setActiveConnection(connection);

          connection.on("accept", () => {
            console.log("[Twilio Client] Outbound call accepted by lead");
            answerCall();
          });

          connection.on("disconnect", () => {
            console.log("[Twilio Client] Call disconnected");
            setActiveConnection(null);
            endCall();
          });

          connection.on("error", (error: { message: string }) => {
            console.error("[Twilio Client] Connection error:", error.message);
            setActiveConnection(null);
            endCall();
          });
        }).catch((err: Error) => {
          console.error("[Twilio Client] Connection failed:", err);
          endCall();
        });

      } else {
        console.warn("[Twilio Client] WebRTC device not ready. Running in simulated mode.");
        const timer = setTimeout(() => {
          answerCall();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeCall, activeCall?.status, twilioDevice, answerCall, endCall]);

  // Simulate an incoming call after 15 seconds of logging in
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!activeCall && !incomingCall) {
        setIncomingCall({
          leadId: "lead-2",
          leadName: "Sophia Martinez",
          phone: "+1 (555) 304-9811",
        });
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [activeCall, incomingCall, setIncomingCall]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const menuItems = [
    { name: "Analytics Dashboard", path: "/dashboard", icon: LayoutDashboard, color: "#6366f1" },
    { name: "Leads Management", path: "/dashboard/leads", icon: Users, color: "#0ea5e9" },
    { name: "Follow-ups Calendar", path: "/dashboard/followups", icon: Calendar, color: "#f59e0b" },
    { name: "Tasks & Activity", path: "/dashboard/tasks", icon: CheckSquare, color: "#8b5cf6" },
    { name: "Calling Center", path: "/dashboard/calling", icon: Phone, color: "#10b981" },
    { name: "WhatsApp Business", path: "/dashboard/whatsapp", icon: MessageSquare, color: "#14b8a6" },
    { name: "Employee Targets", path: "/dashboard/employees", icon: UserCheck, color: "#d946ef" },
    { name: "Reports Center", path: "/dashboard/reports", icon: BarChart3, color: "#06b6d4" },
    { name: "Security Audit Logs", path: "/dashboard/audit-logs", icon: ShieldCheck, color: "#f43f5e" },
    { name: "Settings Portal", path: "/dashboard/settings", icon: SettingsIcon, color: "#94a3b8" },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Bootstrapping Secure Environment...</p>
        </div>
      </div>
    );
  }

  // Format call duration MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Extract page breadcrumbs
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    return ["Home", ...segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1))];
  };

  // On mobile the drawer is always full-width when open, regardless of the desktop collapse toggle
  const showExpanded = sidebarOpen || mobileSidebarOpen;

  return (
    <div className={`h-screen overflow-hidden flex text-foreground bg-background ${theme === "dark" ? "dark" : ""}`}>
      {/* Mobile drawer backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 80 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className={`fixed md:relative inset-y-0 left-0 h-full max-md:!w-72 bg-gradient-to-b from-slate-950 via-sidebar-bg to-slate-950 text-sidebar-fg border-r border-sidebar-border flex flex-col shrink-0 z-40 overflow-hidden transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Ambient brand glow behind logo */}
        <div className="absolute -top-16 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-14 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Branding */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border overflow-hidden shrink-0 relative z-10">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="w-8 h-8 bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-600 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-md shadow-indigo-500/40"
          >
            Ω
          </motion.div>
          <AnimatePresence>
            {showExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate whitespace-nowrap flex-1"
              >
                Enterprise CRM
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden ml-auto p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>



        {/* Menu Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto relative z-10">
          {menuItems.map((item) => {
            const currentActivePath = clickedPath || pathname;
            const isActive = currentActivePath === item.path || (item.path !== "/dashboard" && currentActivePath.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setClickedPath(item.path)}
                style={{ "--item-color": item.color } as React.CSSProperties}
                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative active:scale-[0.98] ${
                  isActive ? "text-white shadow-lg" : "hover:bg-white/5 text-slate-400 hover:text-white hover:translate-x-0.5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}, ${item.color}bb)`,
                      boxShadow: `0 8px 20px -6px ${item.color}80`,
                    }}
                    className="absolute inset-0 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-[var(--item-color)]"
                  }`}
                />
                {showExpanded && <span className="truncate transition-colors duration-200 whitespace-nowrap">{item.name}</span>}
                {!showExpanded && (
                  <div className="absolute left-16 bg-slate-950 text-white text-xs font-semibold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-xl whitespace-nowrap z-50 translate-x-1 group-hover:translate-x-0 border-l-2" style={{ borderColor: item.color }}>
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button (desktop only — mobile drawer is always full width) */}
        <div className="hidden md:block p-4 border-t border-sidebar-border/30 shrink-0 relative z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={toggleSidebar}
            className="w-full py-2 bg-white/5 hover:bg-gradient-to-r hover:from-indigo-600/20 hover:to-violet-600/20 border border-sidebar-border/30 hover:border-indigo-500/40 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <motion.span animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.3 }}>
              «
            </motion.span>
            {sidebarOpen && <span className="whitespace-nowrap">Collapse Side Panel</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Panel Viewport */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {getBreadcrumbs().map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  <span className={i === getBreadcrumbs().length - 1 ? "text-foreground font-semibold" : ""}>{b}</span>
                </React.Fragment>
              ))}
            </div>

            {/* Mock Global Search bar */}
            <div className="relative max-w-md w-full hidden sm:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-indigo-500" />
              <input
                type="text"
                placeholder="Global search leads, pipeline status, activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 bg-secondary border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl text-xs transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {/* Notifications Alert Center */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
                className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some((n) => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-glow-pulse" />
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-xl p-4 overflow-hidden z-50"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-border mb-3">
                      <span className="font-bold text-sm">Workspace Alerts</span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-semibold">
                        {notifications.filter((n) => !n.isRead).length} Unread
                      </span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            handleMarkAsRead(n.id);
                            setShowNotifications(false);
                          }}
                          className={`p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${n.isRead ? "bg-transparent border-transparent hover:bg-secondary" : "bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10"
                            }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[9px] font-normal text-muted-foreground">{n.createdAt}</span>
                          </div>
                          <p className="text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-secondary border border-border/40 rounded-xl transition-all"
              >
                <div className="relative w-8 h-8 shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    {session?.user?.name?.charAt(0) || "U"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-glow-pulse" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-foreground leading-none">{session?.user?.name}</p>
                  <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 inline-block leading-none">
                    {(session?.user as { role?: string })?.role || "ADMIN"}
                  </span>
                </div>
              </motion.button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute right-0 mt-3 w-56 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-xl p-3 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border mb-2">
                      <p className="text-xs text-muted-foreground">Logged in as</p>
                      <p className="text-sm font-bold truncate mt-0.5">{session?.user?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowProfile(false)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4" />
                      My Profile settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-6 overflow-y-auto z-10 bg-gradient-mesh">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Real-time Interactive Dialing Overlay Widget (Click-to-Call) */}
        <AnimatePresence>
          {activeCall && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-4 right-4 left-4 sm:left-auto bg-slate-900 text-white rounded-2xl border border-indigo-800 shadow-2xl p-4 w-auto sm:w-80 z-50 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center animate-pulse">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-400">Memat Digi pvt.Ltd</div>
                  <div className="text-sm font-bold truncate mt-0.5">{activeCall.leadName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{activeCall.phone}</div>
                </div>
                {activeCall.status === "ended" ? (
                  <button
                    onClick={() => useCRMStore.setState({ activeCall: null })}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="text-xs font-mono font-bold bg-indigo-950 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-800/40">
                    {formatTime(callTimer)}
                  </div>
                )}
              </div>

              {activeCall.status === "ringing" ? (
                <div className="flex flex-col gap-2.5">
                  <div className="text-xs text-center text-indigo-400 animate-pulse font-medium">Dialing (Connecting SIP trunk...)</div>
                  <button
                    onClick={() => {
                      if (activeConnection) {
                        activeConnection.disconnect();
                      }
                      endCall();
                    }}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    Cancel Call
                  </button>
                </div>
              ) : activeCall.status === "connected" ? (
                <div className="flex flex-col gap-3">
                  <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 justify-center bg-emerald-500/5 py-1 rounded-lg border border-emerald-500/10">
                    <Volume2 className="w-3.5 h-3.5" /> Call Active & Recording...
                  </div>
                  <button
                    onClick={async () => {
                      if (activeConnection) {
                        activeConnection.disconnect();
                      }
                      // Log to backend API
                      try {
                        await fetch("/api/calls", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            leadId: activeCall.leadId,
                            leadName: activeCall.leadName,
                            userId: "user-current",
                            durationSec: callTimer,
                            callType: "OUTGOING",
                            notes: "Customer call completed via click-to-call softphone.",
                          }),
                        });
                      } catch { }
                      endCall();
                    }}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" /> End Call
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-slate-400 text-center py-2 font-medium">Call Session Closed.</div>
                  <button
                    onClick={() => useCRMStore.setState({ activeCall: null })}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl transition-all text-slate-300 cursor-pointer"
                  >
                    Dismiss Widget
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Incoming Call Popup Banner */}
        <AnimatePresence>
          {incomingCall && !activeCall && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-4 right-4 left-4 sm:left-auto bg-slate-900 border border-emerald-700 text-white p-4 rounded-2xl shadow-2xl w-auto sm:w-80 z-50 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center animate-bounce">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Incoming Call Triggered</div>
                  <div className="text-xs font-bold text-white truncate mt-0.5">{incomingCall.leadName}</div>
                  <div className="text-[9px] text-slate-400 truncate">{incomingCall.phone}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => {
                    if (activeConnection && typeof activeConnection.accept === "function") {
                      activeConnection.accept();
                    }
                    answerCall();
                    useCRMStore.setState({
                      activeCall: {
                        leadId: incomingCall.leadId,
                        leadName: incomingCall.leadName,
                        phone: incomingCall.phone,
                        durationSec: 0,
                        status: "connected",
                      },
                    });
                    setIncomingCall(null);
                  }}
                  className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-2xs font-bold rounded-lg transition-all"
                >
                  Accept Call
                </button>
                <button
                  onClick={() => {
                    if (activeConnection && typeof activeConnection.reject === "function") {
                      activeConnection.reject();
                    }
                    setIncomingCall(null);
                  }}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-2xs font-bold rounded-lg transition-all"
                >
                  Ignore
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
