export interface StoreMetrics {
  storeId: string
  storeName: string
  todayAppointments: number
  actualPacks: number
  shortageCount: number
  urgentCount: number
  isNoonPeakShortage: boolean
  trend7Days: { date: string; shortageCount: number }[]
  hourlyDetail: HourlySlot[]
}

export interface HourlySlot {
  time: string
  appointments: number
  packs: number
  shortages: number
  urgent: number
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
  instrument?: string
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
  reasonDistribution: { reason: ReviewReason; count: number; percentage: number }[]
  suggestions: Suggestion[]
}

export type DateRangePreset = 'all' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'

export interface DateRange {
  preset: DateRangePreset
  start: string
  end: string
}

export interface MonthlyTrendItem {
  week: string
  count: number
}

export interface MonthlyReasonCompare {
  reason: ReviewReason
  lastMonthCount: number
  currentMonthCount: number
  change: number
  changePercentage: number
}

export interface MonthlyStoreCompare {
  storeId: string
  storeName: string
  lastMonthCount: number
  currentMonthCount: number
  change: number
  changePercentage: number
}

export interface MonthlyReport {
  monthRange: string
  totalShortages: number
  lastMonthTotal: number
  monthlyChange: number
  monthlyChangePercentage: number
  trend: MonthlyTrendItem[]
  reasonCompare: MonthlyReasonCompare[]
  storeCompare: MonthlyStoreCompare[]
  topStores: AnomalyStore[]
  topTimeSlots: AnomalyTimeSlot[]
  suggestions: Suggestion[]
}

export interface BudgetRecommendation {
  budget: number
  totalCost: number
  remainingBudget: number
  allocations: {
    packType: string
    addCount: number
    unitCost: number
    totalCost: number
    estimatedRiskReduction: number
  }[]
  estimatedRiskReduction: number
  originalTightCount: number
  estimatedTightCount: number
}

export interface ShiftSuggestion {
  time: string
  type: '备包人员' | '消毒锅排程' | '备包量'
  action: string
  priority: 'high' | 'medium' | 'low'
  expectedImprovement: string
}
