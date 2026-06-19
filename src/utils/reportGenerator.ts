import type {
  ReviewRecord,
  WeeklyReport,
  AnomalyStore,
  AnomalyTimeSlot,
  FrequentInstrument,
  Suggestion,
  ReviewReason,
  DateRange,
} from '@/types'
import { storeOptions, packTypeOptions, frequentInstrumentData } from '@/data/mockData'

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const REASONS: ReviewReason[] = ['预约变更', '消毒锅排程', '器械损坏', '人员漏备']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function parseDate(dateStr: string): Date {
  const [datePart, timePart] = dateStr.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  let hours = 0, minutes = 0
  if (timePart) {
    [hours, minutes] = timePart.split(':').map(Number)
  }
  return new Date(year, month - 1, day, hours, minutes)
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function getWeekStart(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekEnd(d: Date): Date {
  const end = new Date(getWeekStart(d))
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function getDateRangeFromPreset(preset: DateRange['preset']): { start: string; end: string } {
  const now = new Date()
  if (preset === 'thisWeek') {
    return {
      start: formatDate(getWeekStart(now)),
      end: formatDate(now),
    }
  } else if (preset === 'lastWeek') {
    const lastWeekStart = new Date(getWeekStart(now))
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(lastWeekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6)
    return {
      start: formatDate(lastWeekStart),
      end: formatDate(lastWeekEnd),
    }
  }
  return { start: '', end: '' }
}

export function filterRecordsByDateRange(
  records: ReviewRecord[],
  dateRange: DateRange
): ReviewRecord[] {
  if (dateRange.preset === 'all') return records

  let start: Date | null = null
  let end: Date | null = null

  if (dateRange.preset === 'custom') {
    if (dateRange.start) start = new Date(dateRange.start + 'T00:00:00')
    if (dateRange.end) {
      end = new Date(dateRange.end + 'T23:59:59')
    }
  } else {
    const { start: s, end: e } = getDateRangeFromPreset(dateRange.preset)
    if (s) start = new Date(s + 'T00:00:00')
    if (e) end = new Date(e + 'T23:59:59')
  }

  return records.filter((r) => {
    const d = parseDate(r.eventTime)
    if (start && d < start) return false
    if (end && d > end) return false
    return true
  })
}

function extractInstrumentFromNote(note: string, packType: string): string | undefined {
  for (const inst of frequentInstrumentData) {
    if (note.includes(inst.instrumentName) || inst.relatedPackTypes.includes(packType)) {
      return inst.instrumentName
    }
  }
  return undefined
}

function getTimeSlotLabel(date: Date): string {
  const weekday = WEEKDAY_NAMES[date.getDay()]
  const hour = date.getHours()
  if (hour >= 9 && hour < 11) return `${weekday} 09:00-11:00`
  if (hour >= 11 && hour < 13) return `${weekday} 11:00-13:00`
  if (hour >= 13 && hour < 15) return `${weekday} 13:00-15:00`
  if (hour >= 15 && hour < 17) return `${weekday} 15:00-17:00`
  return `${weekday} ${pad(hour)}:00-${pad(hour + 2)}:00`
}

export function generateWeeklyReport(
  records: ReviewRecord[],
  dateRangeStr: string
): WeeklyReport {
  const totalShortages = records.length

  const storeMap = new Map<string, { count: number; name: string }>()
  const timeSlotMap = new Map<string, number>()
  const instrumentMap = new Map<string, { count: number; packTypes: Set<string> }>()
  const reasonMap = new Map<ReviewReason, number>()
  const packTypeShortageMap = new Map<string, number>()

  records.forEach((r) => {
    const d = parseDate(r.eventTime)
    const timeSlot = getTimeSlotLabel(d)

    if (!storeMap.has(r.storeId)) {
      storeMap.set(r.storeId, { count: 0, name: r.storeName })
    }
    storeMap.get(r.storeId)!.count++

    timeSlotMap.set(timeSlot, (timeSlotMap.get(timeSlot) || 0) + 1)
    reasonMap.set(r.reason, (reasonMap.get(r.reason) || 0) + 1)
    packTypeShortageMap.set(r.packType, (packTypeShortageMap.get(r.packType) || 0) + 1)

    const inst = r.instrument || extractInstrumentFromNote(r.note, r.packType)
    if (inst) {
      if (!instrumentMap.has(inst)) {
        instrumentMap.set(inst, { count: 0, packTypes: new Set() })
      }
      const entry = instrumentMap.get(inst)!
      entry.count++
      entry.packTypes.add(r.packType)
    }
  })

  const storeAppointmentTotals: Record<string, number> = {
    S001: 42,
    S002: 35,
    S003: 38,
    S004: 28,
    S005: 31,
  }

  const topShortageStores: AnomalyStore[] = Array.from(storeMap.entries())
    .map(([storeId, { count, name }]) => ({
      storeId,
      storeName: name,
      shortageCount: count,
      shortageRate: Math.round((count / (storeAppointmentTotals[storeId] || 30)) * 1000) / 10,
    }))
    .sort((a, b) => b.shortageCount - a.shortageCount)
    .slice(0, 5)

  const topShortageTimeSlots: AnomalyTimeSlot[] = Array.from(timeSlotMap.entries())
    .map(([timeSlot, count]) => ({ timeSlot, shortageCount: count }))
    .sort((a, b) => b.shortageCount - a.shortageCount)
    .slice(0, 3)

  const topMissingInstruments: FrequentInstrument[] = Array.from(instrumentMap.entries())
    .map(([name, { count, packTypes }]) => ({
      instrumentName: name,
      shortageCount: count,
      relatedPackTypes: Array.from(packTypes),
    }))
    .sort((a, b) => b.shortageCount - a.shortageCount)
    .slice(0, 3)

  const reasonDistribution: { reason: ReviewReason; count: number; percentage: number }[] = REASONS.map(
    (r) => {
      const count = reasonMap.get(r) || 0
      return {
        reason: r,
        count,
        percentage: totalShortages > 0 ? Math.round((count / totalShortages) * 100) : 0,
      }
    }
  ).sort((a, b) => b.count - a.count)

  const suggestions: Suggestion[] = generateSuggestions(
    topShortageStores,
    topShortageTimeSlots,
    packTypeShortageMap,
    reasonDistribution,
    records
  )

  return {
    weekRange: dateRangeStr,
    totalShortages,
    topShortageStores,
    topShortageTimeSlots,
    topMissingInstruments,
    reasonDistribution,
    suggestions,
  }
}

function generateSuggestions(
  topStores: AnomalyStore[],
  topTimeSlots: AnomalyTimeSlot[],
  packTypeShortages: Map<string, number>,
  reasonDist: { reason: ReviewReason; count: number; percentage: number }[],
  records: ReviewRecord[]
): Suggestion[] {
  const suggestions: Suggestion[] = []

  if (topStores.length > 0) {
    const tightPackTypes = Array.from(packTypeShortages.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])

    if (tightPackTypes.length > 0) {
      const topStore = topStores[0]
      suggestions.push({
        type: '增配包',
        target: topStore.storeName,
        description: `建议为${topStore.storeName}增配${tightPackTypes
          .map(([pt]) => pt)
          .join('、')}，该门店本周缺包率${topStore.shortageRate}%，${tightPackTypes
          .map(([pt, c]) => `${pt}缺包${c}次`)
          .join('，')}，供应明显不足`,
      })
    }

    if (packTypeShortages.get('种植包')! >= 2 || packTypeShortages.get('外科包')! >= 3) {
      const types = []
      if (packTypeShortages.get('种植包')! >= 2) types.push('种植包')
      if (packTypeShortages.get('外科包')! >= 3) types.push('外科包')
      suggestions.push({
        type: '增配包',
        target: '全部门店',
        description: `${types.join('、')}本周整体缺包率偏高，建议全部门店各增配1套${types.join('、')}作为应急储备`,
      })
    }
  }

  if (topTimeSlots.length > 0) {
    const peakSlot = topTimeSlots[0]
    suggestions.push({
      type: '调整备包时间',
      target: topStores.length > 0 ? topStores[0].storeName : '全部门店',
      description: `「${peakSlot.timeSlot}」本周缺包${peakSlot.shortageCount}次，为最高频时段，建议将该时段备包量提升25%，并提前30分钟完成消毒`,
    })

    const noonPeakSlots = topTimeSlots.filter((t) => t.timeSlot.includes('11:00-13:00'))
    if (noonPeakSlots.length > 0) {
      suggestions.push({
        type: '调整备包时间',
        target: '全部门店',
        description: '午高峰时段(11:00-13:00)缺包频发，建议将消毒锅排程从9:00提前至7:30，确保午高峰前所有外科包和修复包完成消毒',
      })
    }
  }

  const staffIssue = reasonDist.find((r) => r.reason === '人员漏备')
  if (staffIssue && staffIssue.count >= 2) {
    const staffStores = new Set(
      records.filter((r) => r.reason === '人员漏备').map((r) => r.storeName)
    )
    suggestions.push({
      type: '培训新护士',
      target: Array.from(staffStores).join('、'),
      description: `本周发生${staffIssue.count}次人员漏备事件（占比${staffIssue.percentage}%），涉及${Array.from(staffStores).join('、')}，建议对新入职护士进行备包清单专项培训及考核`,
    })
  }

  const scheduleIssue = reasonDist.find((r) => r.reason === '消毒锅排程')
  if (scheduleIssue && scheduleIssue.count >= 2) {
    suggestions.push({
      type: '调整备包时间',
      target: '全部门店',
      description: `本周因消毒锅排程问题导致${scheduleIssue.count}次缺包（占比${scheduleIssue.percentage}%），建议优化消毒锅排程，高峰时段前2小时完成所有包型消毒`,
    })
  }

  const equipmentIssue = reasonDist.find((r) => r.reason === '器械损坏')
  if (equipmentIssue && equipmentIssue.count >= 2) {
    suggestions.push({
      type: '增配包',
      target: '全部门店',
      description: `本周因器械损坏导致${equipmentIssue.count}次缺包，建议检查并更新老化器械，对高频损坏的器械增加备用量`,
    })
  }

  const appointmentIssue = reasonDist.find((r) => r.reason === '预约变更')
  if (appointmentIssue && appointmentIssue.count >= 3) {
    suggestions.push({
      type: '调整备包时间',
      target: '预约前台',
      description: `本周因临时预约变更导致${appointmentIssue.count}次加急备包，建议前台加强与患者的预约确认，手术类项目提前1天再次确认，预留足够备包时间`,
    })
  }

  return suggestions
}

export function formatWeekRange(start: string, end: string): string {
  if (!start || !end) return '自定义日期范围'
  return `${start} ~ ${end}`
}

export function generateExportText(report: WeeklyReport, storeFilter: string, reasonFilter: string): string {
  const reasonConfig: Record<ReviewReason, { color: string; label: string }> = {
    '预约变更': { color: '蓝色', label: '预约变更' },
    '消毒锅排程': { color: '琥珀色', label: '消毒锅排程' },
    '器械损坏': { color: '红色', label: '器械损坏' },
    '人员漏备': { color: '紫色', label: '人员漏备' },
  }

  const storeName = storeFilter
    ? storeOptions.find((s) => s.id === storeFilter)?.name || ''
    : '全部门店'
  const reasonName = reasonFilter || '全部原因'

  let text = `【器械包备包周度简报】\n`
  text += `统计周期：${report.weekRange}\n`
  text += `筛选范围：${storeName} · ${reasonName}\n`
  text += `生成时间：${new Date().toLocaleString('zh-CN')}\n`
  text += `═══════════════════════════════════════\n\n`

  text += `📊 本周概览\n`
  text += `  • 总缺包次数：${report.totalShortages} 次\n\n`

  if (report.topShortageStores.length > 0) {
    text += `🏥 缺包门店排行 TOP3\n`
    report.topShortageStores.slice(0, 3).forEach((s, i) => {
      text += `  ${i + 1}. ${s.storeName}：${s.shortageCount}次（缺包率 ${s.shortageRate}%）\n`
    })
    text += '\n'
  }

  if (report.topShortageTimeSlots.length > 0) {
    text += `⏰ 缺包高发时段 TOP3\n`
    report.topShortageTimeSlots.forEach((t, i) => {
      text += `  ${i + 1}. ${t.timeSlot}：${t.shortageCount}次\n`
    })
    text += '\n'
  }

  if (report.topMissingInstruments.length > 0) {
    text += `🔧 常缺器械 TOP3\n`
    report.topMissingInstruments.forEach((inst, i) => {
      text += `  ${i + 1}. ${inst.instrumentName}：${inst.shortageCount}次（关联：${inst.relatedPackTypes.join('、')}）\n`
    })
    text += '\n'
  }

  if (report.reasonDistribution.length > 0) {
    text += `📋 原因分布\n`
    report.reasonDistribution.forEach((r) => {
      text += `  • ${reasonConfig[r.reason].label}：${r.count}次（${r.percentage}%）\n`
    })
    text += '\n'
  }

  if (report.suggestions.length > 0) {
    text += `💡 优化建议\n`
    report.suggestions.forEach((s, i) => {
      const typeEmoji = s.type === '增配包' ? '📦' : s.type === '调整备包时间' ? '⏱️' : '👩‍⚕️'
      text += `  ${i + 1}. ${typeEmoji}【${s.type}】→ ${s.target}\n`
      text += `     ${s.description}\n`
    })
    text += '\n'
  }

  text += `═══════════════════════════════════════\n`
  text += `— 运营管理部 · 器械包管理看板 —`

  return text
}

export function downloadReport(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
