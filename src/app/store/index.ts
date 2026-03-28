import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarCollapsed: boolean;
  recentTools: string[];
  toggleSidebar: () => void;
  addRecentTool: (toolId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      recentTools: [],
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      addRecentTool: (toolId: string) =>
        set((state) => ({
          recentTools: [toolId, ...state.recentTools.filter((id) => id !== toolId)].slice(0, 5),
        })),
    }),
    { name: 'devops-hub-app' }
  )
);
