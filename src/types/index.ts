export interface StoreMetrics {
  storeId: string
  storeName: string
  todayAppointments: number
  actualPacks: number
  shortageCount: number
  urgentCount: number
  isNoonPeakShortage: boolean
  trend7Days: { date: string; shortageCount: number }[]
}

export interface PackTypeUtilization {
  packType: string
  utilizationRate: number
  totalPacks: number
  usedPacks: number
  status: 'surplus' | 'normal' | 'tight'
}

export interface AnomalyStore {
  storeId: string
  storeName: string
  shortageCount: number
  shortageRate: number
}

export interface AnomalyTimeSlot {
  timeSlot: string
  shortageCount: number
}

export interface FrequentInstrument {
  instrumentName: string
  shortageCount: number
  relatedPackTypes: string[]
}

export type ReviewReason = '预约变更' | '消毒锅排程' | '器械损坏' | '人员漏备'

export interface ReviewRecord {
  id: string
  storeId: string
  storeName: string
  eventTime: string
  packType: string
  reason: ReviewReason
  note: string
  createdBy: string
  createdAt: string
}

export interface Suggestion {
  type: '增配包' | '调整备包时间' | '培训新护士'
  target: string
  description: string
}

export interface WeeklyReport {
  weekRange: string
  totalShortages: number
  topShortageStores: AnomalyStore[]
  topShortageTimeSlots: AnomalyTimeSlot[]
  topMissingInstruments: FrequentInstrument[]
  suggestions: Suggestion[]
}
