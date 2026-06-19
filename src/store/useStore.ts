import { create } from 'zustand'
import type { ReviewRecord } from '@/types'
import { initialReviewRecords } from '@/data/mockData'

interface AppState {
  reviewRecords: ReviewRecord[]
  addReviewRecord: (record: ReviewRecord) => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const STORAGE_KEY = 'dental-dashboard-reviews'

function loadRecords(): ReviewRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as ReviewRecord[]
    }
  } catch {
    // ignore
  }
  return initialReviewRecords
}

function saveRecords(records: ReviewRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // ignore
  }
}

export const useStore = create<AppState>((set) => ({
  reviewRecords: loadRecords(),
  addReviewRecord: (record) =>
    set((state) => {
      const updated = [record, ...state.reviewRecords]
      saveRecords(updated)
      return { reviewRecords: updated }
    }),
  drawerOpen: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
