import { create } from "zustand";

interface Toast {
  id:      number;
  message: string;
  type:    "success" | "error" | "gold" | "default";
}

interface UIStore {
  /* Intro sequence */
  hasSeenIntro:     boolean;
  introComplete:    boolean;
  completeIntro:    () => void;

  /* Sidebar */
  activeTab:        "sentiment" | "post" | "discuss";
  setActiveTab:     (t: UIStore["activeTab"]) => void;

  /* Mobile nav */
  mobileSection:    string;
  setMobileSection: (s: string) => void;
  menuOpen:         boolean;
  toggleMenu:       () => void;

  /* Wallet */
  walletConnected:  boolean;
  walletAddress:    string | null;
  walletLoading:    boolean;
  connectWallet:    () => Promise<void>;

  /* Toast queue */
  toasts:           Toast[];
  showToast:        (msg: string, type?: Toast["type"]) => void;
  dismissToast:     (id: number) => void;
}

let _toastId = 0;

export const useUIStore = create<UIStore>()((set, get) => ({
  // Intro: check sessionStorage so it only shows once per browser session,
  // not on every page navigation within the session.
  hasSeenIntro:    typeof window !== "undefined"
                   && sessionStorage.getItem("cc_intro_seen") === "1",
  introComplete:   typeof window !== "undefined"
                   && sessionStorage.getItem("cc_intro_seen") === "1",

  completeIntro() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cc_intro_seen", "1");
    }
    set({ introComplete: true, hasSeenIntro: true });
  },

  activeTab:       "sentiment",
  mobileSection:   "broadcast",
  menuOpen:        false,
  walletConnected: false,
  walletAddress:   null,
  walletLoading:   false,
  toasts:          [],

  setActiveTab:     (t) => set({ activeTab: t }),
  setMobileSection: (s) => set({ mobileSection: s }),
  toggleMenu:       () => set((s) => ({ menuOpen: !s.menuOpen })),

  /* Mock wallet — swap for wagmi/ethers in production */
  async connectWallet() {
    if (get().walletConnected) {
      get().showToast(`Connected: ${get().walletAddress}`, "gold");
      return;
    }
    set({ walletLoading: true });
    await new Promise((r) => setTimeout(r, 1400));
    const addr = "0x" + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    set({ walletConnected: true, walletAddress: addr, walletLoading: false });
    get().showToast("✓ Wallet connected!", "success");
  },

  showToast(message, type = "default") {
    const id = ++_toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
