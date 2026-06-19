import { useState, useMemo, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { storeOptions, packTypeOptions } from '@/data/mockData'
import type { ReviewRecord, ReviewReason, DateRange, DateRangePreset, WeeklyReport, MonthlyReport } from '@/types'
import {
  getDateRangeFromPreset,
  filterRecordsByDateRange,
  generateWeeklyReport,
  formatWeekRange,
  generateExportText,
  downloadReport,
  generateMonthlyReport,
  generateEmptyReportText,
  generateMonthlyExportText,
} from '@/utils/reportGenerator'
import {
  Plus,
  X,
  ChevronRight,
  MapPin,
  Clock,
  Wrench,
  Lightbulb,
  Copy,
  Download,
  Check,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const reasonConfig: Record<ReviewReason, { color: string; bg: string }> = {
  '预约变更': { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  '消毒锅排程': { color: '#FFA502', bg: 'rgba(255,165,2,0.15)' },
  '器械损坏': { color: '#FF4757', bg: 'rgba(255,71,87,0.15)' },
  '人员漏备': { color: '#A78BFA', bg: 'rgba(167,139,255,0.15)' },
}

const suggestionTagConfig: Record<string, { color: string; bg: string }> = {
  '增配包': { color: '#00D4AA', bg: 'rgba(0,212,170,0.15)' },
  '调整备包时间': { color: '#FFA502', bg: 'rgba(255,165,2,0.15)' },
  '培训新护士': { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
}

const reasons: ReviewReason[] = ['预约变更', '消毒锅排程', '器械损坏', '人员漏备']

const weekDatePresetOptions: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'thisWeek', label: '本周' },
  { value: 'lastWeek', label: '上周' },
  { value: 'custom', label: '自定义' },
]

const monthDatePresetOptions: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'thisMonth', label: '本月' },
  { value: 'lastMonth', label: '上月' },
  { value: 'custom', label: '自定义' },
]

const PAGE_SIZE = 6

export default function Review() {
  const { reviewRecords, addReviewRecord, drawerOpen, setDrawerOpen } = useStore()

  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [filterStore, setFilterStore] = useState('')
  const [filterReason, setFilterReason] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: 'thisWeek',
    start: '',
    end: '',
  })
  const [page, setPage] = useState(1)
  const [copySuccess, setCopySuccess] = useState(false)

  const [formStoreId, setFormStoreId] = useState('')
  const [formEventTime, setFormEventTime] = useState('')
  const [formPackType, setFormPackType] = useState('')
  const [formReason, setFormReason] = useState<ReviewReason | ''>('')
  const [formNote, setFormNote] = useState('')

  const datePresetOptions = viewMode === 'week' ? weekDatePresetOptions : monthDatePresetOptions

  const dateFilteredRecords = useMemo(() => {
    return filterRecordsByDateRange(reviewRecords, dateRange)
  }, [reviewRecords, dateRange])

  const filtered = useMemo(() => {
    return dateFilteredRecords.filter((r) => {
      if (filterStore && r.storeId !== filterStore) return false
      if (filterReason && r.reason !== filterReason) return false
      return true
    })
  }, [dateFilteredRecords, filterStore, filterReason])

  const isEmpty = filtered.length === 0

  const dateRangeStr = useMemo(() => {
    if (dateRange.preset === 'all') return '全部数据'
    if (dateRange.preset === 'custom') {
      return formatWeekRange(dateRange.start, dateRange.end)
    }
    const { start, end } = getDateRangeFromPreset(dateRange.preset)
    return formatWeekRange(start, end)
  }, [dateRange])

  const weeklyReport: WeeklyReport = useMemo(() => {
    return generateWeeklyReport(filtered, dateRangeStr)
  }, [filtered, dateRangeStr])

  const monthlyReport: MonthlyReport | null = useMemo(() => {
    if (viewMode !== 'month') return null
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const currentMonthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
    const lastMonthStart = `${now.getFullYear()}-${pad(now.getMonth())}-01`
    const lastMonthEnd = `${now.getFullYear()}-${pad(now.getMonth())}-${new Date(now.getFullYear(), now.getMonth(), 0).getDate()}`
    return generateMonthlyReport(filtered, dateRangeStr, currentMonthStart, lastMonthStart, lastMonthEnd)
  }, [viewMode, filtered, dateRangeStr])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleViewModeChange = (mode: 'week' | 'month') => {
    if (mode === viewMode) return
    setViewMode(mode)
    const newPreset: DateRangePreset = mode === 'week' ? 'thisWeek' : 'thisMonth'
    setDateRange({
      preset: newPreset,
      start: '',
      end: '',
    })
    setPage(1)
  }

  const handlePresetChange = (preset: DateRangePreset) => {
    const newDateRange: DateRange = {
      preset,
      start: '',
      end: '',
    }
    if (preset === 'custom') {
      const today = new Date()
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const pad = (n: number) => String(n).padStart(2, '0')
      newDateRange.start = `${weekAgo.getFullYear()}-${pad(weekAgo.getMonth() + 1)}-${pad(weekAgo.getDate())}`
      newDateRange.end = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    }
    setDateRange(newDateRange)
    setPage(1)
  }

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }))
    setPage(1)
  }

  const resetForm = () => {
    setFormStoreId('')
    setFormEventTime('')
    setFormPackType('')
    setFormReason('')
    setFormNote('')
  }

  const handleSubmit = () => {
    if (!formStoreId || !formEventTime || !formPackType || !formReason) return
    const store = storeOptions.find((s) => s.id === formStoreId)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const record: ReviewRecord = {
      id: `R${Date.now()}`,
      storeId: formStoreId,
      storeName: store?.name ?? '',
      eventTime: formEventTime.replace('T', ' '),
      packType: formPackType,
      reason: formReason,
      note: formNote,
      createdBy: '当前用户',
      createdAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    }
    addReviewRecord(record)
    resetForm()
    setDrawerOpen(false)
  }

  const handleCopy = async () => {
    let text = ''
    if (isEmpty) {
      text = generateEmptyReportText(dateRangeStr, filterStore, filterReason)
    } else if (viewMode === 'week') {
      text = generateExportText(weeklyReport, filterStore, filterReason)
    } else if (monthlyReport) {
      text = generateMonthlyExportText(monthlyReport, filterStore, filterReason)
    }
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleDownload = () => {
    let text = ''
    let filename = ''
    const timestamp = new Date().toISOString().slice(0, 10)
    if (isEmpty) {
      text = generateEmptyReportText(dateRangeStr, filterStore, filterReason)
      filename = viewMode === 'week' ? `周度简报_${timestamp}.txt` : `月度简报_${timestamp}.txt`
    } else if (viewMode === 'week') {
      text = generateExportText(weeklyReport, filterStore, filterReason)
      filename = `周度简报_${timestamp}.txt`
    } else if (monthlyReport) {
      text = generateMonthlyExportText(monthlyReport, filterStore, filterReason)
      filename = `月度简报_${timestamp}.txt`
    }
    downloadReport(text, filename)
  }

  useEffect(() => {
    setPage(1)
  }, [filterStore, filterReason])

  const renderEmptyState = () => (
    <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-8 flex flex-col items-center justify-center animate-fade-in">
      <CheckCircle size={56} className="text-mint-500 mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2 font-sans">本周期暂无缺包事件</h3>
      <p className="text-sm text-slate-400 text-center mb-6 font-sans max-w-md">
        当前筛选条件下未记录任何缺包事件，备包运行状态良好
      </p>
      <div className="w-full max-w-md space-y-3 mb-6">
        <h4 className="text-sm font-medium text-slate-300 font-sans">管理建议</h4>
        {[
          '当前备包流程运转顺畅，建议继续保持现有备包标准',
          '建议护士长继续严格执行备包清单核对制度',
          '可适当关注消毒锅排程优化，进一步提升周转效率',
          '建议持续观察2-3周，确认无异常后可考虑优化包型配置',
        ].map((suggestion, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md bg-navy-800/60 border border-navy-700/30 p-3"
          >
            <span className="w-5 h-5 rounded-full bg-mint-500/20 text-mint-500 flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{suggestion}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 w-full max-w-md">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-1.5 flex-1 rounded-md bg-navy-800 hover:bg-navy-700 text-slate-300 text-sm px-3 py-2 transition-colors font-sans"
        >
          {copySuccess ? <Check size={14} className="text-mint-500" /> : <Copy size={14} />}
          {copySuccess ? '已复制' : '复制空态结论'}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-1.5 flex-1 rounded-md bg-navy-800 hover:bg-navy-700 text-slate-300 text-sm px-3 py-2 transition-colors font-sans"
        >
          <Download size={14} />
          下载
        </button>
      </div>
    </div>
  )

  const renderWeeklyReport = () => (
    <>
      <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white font-sans">周度简报</h2>
          <span className="text-xs text-slate-500 font-mono">{weeklyReport.weekRange}</span>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold font-mono text-mint-500">{weeklyReport.totalShortages}</span>
          <span className="text-sm text-slate-400 font-sans">次缺包</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 flex-1 rounded-md bg-navy-800 hover:bg-navy-700 text-slate-300 text-sm px-3 py-2 transition-colors font-sans"
          >
            {copySuccess ? <Check size={14} className="text-mint-500" /> : <Copy size={14} />}
            {copySuccess ? '已复制' : '复制'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 flex-1 rounded-md bg-navy-800 hover:bg-navy-700 text-slate-300 text-sm px-3 py-2 transition-colors font-sans"
          >
            <Download size={14} />
            下载
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3.5 h-3.5 rounded-full bg-mint-500" />
          <h3 className="text-sm font-medium text-slate-300 font-sans">原因分布</h3>
        </div>
        <div className="space-y-3">
          {weeklyReport.reasonDistribution.map((item) => {
            const cfg = reasonConfig[item.reason]
            return (
              <div key={item.reason}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-300 font-sans">{item.reason}</span>
                  <span className="text-xs font-mono text-slate-400">{item.count}次 ({item.percentage}%)</span>
                </div>
                <div className="h-2 rounded-full bg-navy-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: cfg.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={14} className="text-warn-red" />
          <h3 className="text-sm font-medium text-slate-300 font-sans">TOP3 缺包门店</h3>
        </div>
        <ul className="space-y-2">
          {weeklyReport.topShortageStores.slice(0, 3).map((s, i) => (
            <li key={s.storeId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold font-mono" style={{ background: i === 0 ? 'rgba(255,71,87,0.2)' : i === 1 ? 'rgba(255,165,2,0.2)' : 'rgba(0,212,170,0.2)', color: i === 0 ? '#FF4757' : i === 1 ? '#FFA502' : '#00D4AA' }}>
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300 font-sans">{s.storeName}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{s.shortageCount}次 <span className="text-slate-500">({s.shortageRate}%)</span></span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-warn-amber" />
          <h3 className="text-sm font-medium text-slate-300 font-sans">TOP3 缺包时段</h3>
        </div>
        <ul className="space-y-2">
          {weeklyReport.topShortageTimeSlots.map((t, i) => (
            <li key={t.timeSlot} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold font-mono" style={{ background: i === 0 ? 'rgba(255,71,87,0.2)' : i === 1 ? 'rgba(255,165,2,0.2)' : 'rgba(0,212,170,0.2)', color: i === 0 ? '#FF4757' : i === 1 ? '#FFA502' : '#00D4AA' }}>
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300 font-sans">{t.timeSlot}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{t.shortageCount}次</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench size={14} className="text-mint-500" />
          <h3 className="text-sm font-medium text-slate-300 font-sans">TOP3 常缺器械</h3>
        </div>
        <ul className="space-y-2">
          {weeklyReport.topMissingInstruments.map((inst, i) => (
            <li key={inst.instrumentName} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold font-mono" style={{ background: i === 0 ? 'rgba(255,71,87,0.2)' : i === 1 ? 'rgba(255,165,2,0.2)' : 'rgba(0,212,170,0.2)', color: i === 0 ? '#FF4757' : i === 1 ? '#FFA502' : '#00D4AA' }}>
                  {i + 1}
                </span>
                <span className="text-sm text-slate-300 font-sans">{inst.instrumentName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-sans">{inst.relatedPackTypes.join(', ')}</span>
                <span className="text-xs font-mono text-slate-400">{inst.shortageCount}次</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} className="text-warn-amber" />
          <h3 className="text-sm font-medium text-slate-300 font-sans">优化建议</h3>
        </div>
        <ul className="space-y-3">
          {weeklyReport.suggestions.map((s, i) => {
            const tag = suggestionTagConfig[s.type]
            return (
              <li key={i} className="rounded-md bg-navy-800/60 border border-navy-700/30 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ color: tag.color, backgroundColor: tag.bg }}
                  >
                    {s.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400">→ {s.target}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{s.description}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )

  const renderMonthlyReport = () => {
    if (!monthlyReport) return null

    const renderChangeIcon = (change: number) => {
      if (change > 0) {
        return <TrendingUp size={14} className="text-red-500" />
      } else if (change < 0) {
        return <TrendingDown size={14} className="text-green-500" />
      }
      return <Minus size={14} className="text-slate-500" />
    }

    return (
      <>
        <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white font-sans">月度简报</h2>
            <span className="text-xs text-slate-500 font-mono">{monthlyReport.monthRange}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-mint-500">{monthlyReport.totalShortages}</span>
            <span className="text-sm text-slate-400 font-sans">次缺包</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-400 font-sans">环比上月：</span>
            <div className="flex items-center gap-1">
              {renderChangeIcon(monthlyReport.monthlyChange)}
              <span
                className="text-xs font-mono font-medium"
                style={{
                  color: monthlyReport.monthlyChange > 0 ? '#EF4444' : monthlyReport.monthlyChange < 0 ? '#22C55E' : '#64748B',
                }}
              >
                {monthlyReport.monthlyChange >= 0 ? '+' : ''}{monthlyReport.monthlyChange} 次
                ({monthlyReport.monthlyChangePercentage >= 0 ? '+' : ''}{monthlyReport.monthlyChangePercentage}%)
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 flex-1 rounded-md bg-navy-800 hover:bg-navy-700 text-slate-300 text-sm px-3 py-2 transition-colors font-sans"
            >
              {copySuccess ? <Check size={14} className="text-mint-500" /> : <Copy size={14} />}
              {copySuccess ? '已复制' : '复制'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 flex-1 rounded-md bg-navy-800 hover:bg-navy-700 text-slate-300 text-sm px-3 py-2 transition-colors font-sans"
            >
              <Download size={14} />
              下载
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3.5 h-3.5 rounded-full bg-mint-500" />
            <h3 className="text-sm font-medium text-slate-300 font-sans">月度趋势</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyReport.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(36,74,98,0.3)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={{ stroke: 'rgba(36,74,98,0.5)' }}
                  tickLine={{ stroke: 'rgba(36,74,98,0.5)' }}
                />
                <YAxis
                  tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={{ stroke: 'rgba(36,74,98,0.5)' }}
                  tickLine={{ stroke: 'rgba(36,74,98,0.5)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A1628',
                    border: '1px solid rgba(36,74,98,0.5)',
                    borderRadius: '8px',
                    color: '#E2E8F0',
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#00D4AA"
                  strokeWidth={2}
                  dot={{ fill: '#00D4AA', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#00D4AA' }}
                  name="缺包次数"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={14} className="text-mint-500" />
            <h3 className="text-sm font-medium text-slate-300 font-sans">原因变化对比</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-navy-700/50 text-slate-400">
                  <th className="text-left py-2 px-2 font-medium text-xs">原因</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">本月</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">上月</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">变化</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">变化率</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.reasonCompare.map((item) => {
                  const cfg = reasonConfig[item.reason]
                  return (
                    <tr key={item.reason} className="border-b border-navy-700/30">
                      <td className="py-2 px-2">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          {item.reason}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-xs font-mono text-slate-300">{item.currentMonthCount}次</td>
                      <td className="py-2 px-2 text-right text-xs font-mono text-slate-400">{item.lastMonthCount}次</td>
                      <td className="py-2 px-2 text-center">
                        {renderChangeIcon(item.change)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className="text-xs font-mono font-medium"
                          style={{
                            color: item.change > 0 ? '#EF4444' : item.change < 0 ? '#22C55E' : '#64748B',
                          }}
                        >
                          {item.changePercentage >= 0 ? '+' : ''}{item.changePercentage}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-warn-red" />
            <h3 className="text-sm font-medium text-slate-300 font-sans">门店对比排行</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-navy-700/50 text-slate-400">
                  <th className="text-left py-2 px-2 font-medium text-xs">排名</th>
                  <th className="text-left py-2 px-2 font-medium text-xs">门店</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">本月</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">上月</th>
                  <th className="text-center py-2 px-2 font-medium text-xs">变化</th>
                  <th className="text-right py-2 px-2 font-medium text-xs">变化率</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.storeCompare.slice(0, 5).map((item, i) => {
                  const hasChange = item.change !== 0
                  return (
                    <tr
                      key={item.storeId}
                      className={`border-b border-navy-700/30 transition-colors ${hasChange ? 'bg-navy-800/30' : ''}`}
                    >
                      <td className="py-2 px-2">
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold font-mono"
                          style={{
                            background: i === 0 ? 'rgba(255,71,87,0.2)' : i === 1 ? 'rgba(255,165,2,0.2)' : 'rgba(0,212,170,0.2)',
                            color: i === 0 ? '#FF4757' : i === 1 ? '#FFA502' : '#00D4AA',
                          }}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs text-slate-300">{item.storeName}</td>
                      <td className="py-2 px-2 text-right text-xs font-mono text-slate-300">{item.currentMonthCount}次</td>
                      <td className="py-2 px-2 text-right text-xs font-mono text-slate-400">{item.lastMonthCount}次</td>
                      <td className="py-2 px-2 text-center">
                        {renderChangeIcon(item.change)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className="text-xs font-mono font-medium"
                          style={{
                            color: item.change > 0 ? '#EF4444' : item.change < 0 ? '#22C55E' : '#64748B',
                          }}
                        >
                          {item.changePercentage >= 0 ? '+' : ''}{item.changePercentage}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-warn-amber" />
            <h3 className="text-sm font-medium text-slate-300 font-sans">优化建议</h3>
          </div>
          <ul className="space-y-3">
            {monthlyReport.suggestions.map((s, i) => {
              const tag = suggestionTagConfig[s.type]
              return (
                <li key={i} className="rounded-md bg-navy-800/60 border border-navy-700/30 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ color: tag.color, backgroundColor: tag.bg }}
                    >
                      {s.type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">→ {s.target}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{s.description}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </>
    )
  }

  return (
    <div className="relative min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-sans">复盘记录与周报</h1>
        <p className="mt-1 text-sm text-slate-400 font-sans">缺包事件复盘追踪与优化建议</p>
      </div>

      <div className="flex gap-5">
        <div className="flex-1 min-w-0" style={{ flex: '6 1 0%' }}>
          <div className="rounded-lg bg-navy-900 border border-navy-700/50 p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={filterStore}
                  onChange={(e) => { setFilterStore(e.target.value); setPage(1) }}
                  className="rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 font-sans"
                >
                  <option value="">全部门店</option>
                  {storeOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={filterReason}
                  onChange={(e) => { setFilterReason(e.target.value); setPage(1) }}
                  className="rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 font-sans"
                >
                  <option value="">全部原因</option>
                  {reasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <div className="flex items-center rounded-md bg-navy-800 border border-navy-700/50 overflow-hidden">
                  <button
                    onClick={() => handleViewModeChange('week')}
                    className={`px-3 py-2 text-sm font-medium transition-colors font-sans ${
                      viewMode === 'week'
                        ? 'bg-mint-500 text-navy-950'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    周视角
                  </button>
                  <button
                    onClick={() => handleViewModeChange('month')}
                    className={`px-3 py-2 text-sm font-medium transition-colors font-sans ${
                      viewMode === 'month'
                        ? 'bg-mint-500 text-navy-950'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    月视角
                  </button>
                </div>
                <select
                  value={dateRange.preset}
                  onChange={(e) => handlePresetChange(e.target.value as DateRangePreset)}
                  className="rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 font-sans"
                >
                  {datePresetOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {dateRange.preset === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className="rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 font-sans"
                    />
                    <span className="text-slate-500 text-sm">至</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      className="rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 font-sans"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-mint-500 hover:bg-mint-600 text-navy-950 font-semibold text-sm px-4 py-2 transition-colors font-sans"
              >
                <Plus size={16} />
                新增复盘
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-navy-900 border border-navy-700/50 overflow-hidden">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-navy-700/50 text-slate-400">
                  <th className="text-left py-3 px-4 font-medium">门店</th>
                  <th className="text-left py-3 px-4 font-medium">时间</th>
                  <th className="text-left py-3 px-4 font-medium">包型</th>
                  <th className="text-left py-3 px-4 font-medium">原因</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => (
                  <tr key={r.id} className="border-b border-navy-700/30 hover:bg-navy-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-200">{r.storeName}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-xs">{r.eventTime}</td>
                    <td className="py-3 px-4 text-slate-300">{r.packType}</td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          color: reasonConfig[r.reason].color,
                          backgroundColor: reasonConfig[r.reason].bg,
                        }}
                      >
                        {r.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="flex items-center gap-1 text-mint-500 hover:text-mint-400 text-xs transition-colors font-sans">
                        查看详情
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">暂无复盘记录</td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-navy-700/50">
                <span className="text-xs text-slate-500 font-mono">
                  共 {filtered.length} 条，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded px-2.5 py-1 text-xs bg-navy-800 text-slate-400 disabled:opacity-40 hover:bg-navy-700 transition-colors font-sans"
                  >
                    上一页
                  </button>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded px-2.5 py-1 text-xs bg-navy-800 text-slate-400 disabled:opacity-40 hover:bg-navy-700 transition-colors font-sans"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 space-y-4" style={{ flex: '4 1 0%' }}>
          {isEmpty ? renderEmptyState() : viewMode === 'week' ? renderWeeklyReport() : renderMonthlyReport()}
        </div>
      </div>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 right-0 z-50 h-full w-[400px] bg-navy-900 border-l border-navy-700/50 animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-navy-700/50">
              <h2 className="text-lg font-semibold text-white font-sans">新增复盘记录</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-sans">门店</label>
                <select
                  value={formStoreId}
                  onChange={(e) => setFormStoreId(e.target.value)}
                  className="w-full rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 transition-colors font-sans"
                >
                  <option value="">请选择门店</option>
                  {storeOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-sans">事件时间</label>
                <input
                  type="datetime-local"
                  value={formEventTime}
                  onChange={(e) => setFormEventTime(e.target.value)}
                  className="w-full rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 transition-colors font-sans"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-sans">包型</label>
                <select
                  value={formPackType}
                  onChange={(e) => setFormPackType(e.target.value)}
                  className="w-full rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 transition-colors font-sans"
                >
                  <option value="">请选择包型</option>
                  {packTypeOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2 font-sans">原因</label>
                <div className="grid grid-cols-2 gap-2">
                  {reasons.map((r) => {
                    const cfg = reasonConfig[r]
                    const selected = formReason === r
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormReason(r)}
                        className="rounded-md border px-3 py-2 text-sm transition-colors font-sans"
                        style={{
                          borderColor: selected ? cfg.color : 'rgba(36,74,98,0.5)',
                          backgroundColor: selected ? cfg.bg : 'transparent',
                          color: selected ? cfg.color : '#94A3B8',
                        }}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-sans">备注</label>
                <textarea
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-md bg-navy-800 border border-navy-700/50 text-slate-300 text-sm px-3 py-2 outline-none focus:border-mint-500 transition-colors resize-none font-sans"
                  placeholder="请输入备注信息..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-navy-700/50">
              <button
                onClick={handleSubmit}
                disabled={!formStoreId || !formEventTime || !formPackType || !formReason}
                className="w-full rounded-md bg-mint-500 hover:bg-mint-600 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold text-sm py-2.5 transition-colors font-sans"
              >
                提交复盘记录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
