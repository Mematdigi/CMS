import { create } from "zustand";

export interface CRMNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface ActiveCall {
  leadId: string;
  leadName: string;
  phone: string;
  durationSec: number;
  status: "idle" | "ringing" | "connected" | "ended";
  isTriggered?: boolean;
}

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface CRMStoreState {
  user: CRMUser | null;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  notifications: CRMNotification[];
  activeCall: ActiveCall | null;
  incomingCall: { leadId: string; leadName: string; phone: string } | null;
  activeChatLeadId: string | null;

  // Actions
  setUser: (user: CRMUser | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  setNotifications: (notifications: CRMNotification[]) => void;
  addNotification: (notification: CRMNotification) => void;
  markNotificationRead: (id: string) => void;
  startCall: (leadId: string, leadName: string, phone: string) => void;
  answerCall: () => void;
  endCall: () => void;
  setIncomingCall: (incoming: { leadId: string; leadName: string; phone: string } | null) => void;
  setActiveChatLeadId: (leadId: string | null) => void;
}

export const useCRMStore = create<CRMStoreState>((set) => ({
  user: null,
  sidebarOpen: true,
  theme: "light",
  notifications: [],
  activeCall: null,
  incomingCall: null,
  activeChatLeadId: null,

  setUser: (user) => set({ user }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),
  startCall: (leadId, leadName, phone) =>
    set({
      activeCall: { leadId, leadName, phone, durationSec: 0, status: "ringing", isTriggered: false },
    }),
  answerCall: () =>
    set((state) => ({
      activeCall: state.activeCall ? { ...state.activeCall, status: "connected" } : null,
    })),
  endCall: () =>
    set((state) => ({
      activeCall: state.activeCall ? { ...state.activeCall, status: "ended" } : null,
      incomingCall: null,
    })),
  setIncomingCall: (incomingCall) => set({ incomingCall }),
  setActiveChatLeadId: (leadId) => set({ activeChatLeadId: leadId }),
}));
