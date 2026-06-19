import { useState } from 'react'
import { AlertTriangle, Package, Clock, AlertCircle, Zap, X } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
  Cell,
} from 'recharts'
import { storeMetricsData } from '@/data/mockData'
import type { StoreMetrics, HourlySlot } from '@/types'

const STORE_COLORS = ['#00D4AA', '#3B82F6', '#FFA502', '#A78BFA', '#FF4757']

const NOON_PEAK_SLOTS = ['11:00-12:00', '12:00-13:00', '13:00-14:00']

const noonPeakStores = storeMetricsData.filter((s) => s.isNoonPeakShortage)

const trendDates = storeMetricsData[0].trend7Days.map((d) => d.date)
const trendChartData = trendDates.map((date) => {
  const entry: Record<string, string | number> = { date }
  storeMetricsData.forEach((store) => {
    const item = store.trend7Days.find((t) => t.date === date)
    entry[store.storeId] = item ? item.shortageCount : 0
  })
  return entry
})

interface StoreCardProps {
  store: StoreMetrics
  color: string
  onClick: () => void
}

function StoreCard({ store, color, onClick }: StoreCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-lg border border-navy-700/50 bg-navy-900 p-4 transition-all hover:border-mint-500/50 hover:bg-navy-900/80 cursor-pointer"
    >
      {store.isNoonPeakShortage && (
        <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-warn-red animate-pulse-dot" />
      )}
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="font-sans text-sm font-medium text-slate-200 truncate">
          {store.storeName}
        </h3>
      </div>
      <div className="space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Clock size={12} />
            今日预约
          </span>
          <span className="text-slate-200">{store.todayAppointments}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Package size={12} />
            实际备包
          </span>
          <span className="text-mint-500">{store.actualPacks}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <AlertCircle size={12} />
            缺包次数
          </span>
          <span className="text-warn-red">{store.shortageCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Zap size={12} />
            加急次数
          </span>
          <span className="text-warn-amber">{store.urgentCount}</span>
        </div>
      </div>
    </div>
  )
}

function NoonPeakAlert() {
  if (noonPeakStores.length === 0) return null

  return (
    <div className="rounded-lg bg-gradient-to-r from-warn-red/20 via-warn-red/10 to-transparent border border-warn-red/30 px-4 py-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-warn-red shrink-0" />
        <span className="font-sans text-sm font-medium text-warn-red">
          午高峰断包预警
        </span>
        <span className="font-sans text-sm text-slate-300">
          {noonPeakStores.map((s) => s.storeName).join('、')}
        </span>
      </div>
    </div>
  )
}

function TrendChart() {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(storeMetricsData.map((s) => s.storeId))
  )

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="rounded-lg border border-navy-700/50 bg-navy-900 p-4">
      <h3 className="mb-4 font-sans text-sm font-medium text-slate-200">
        近7日缺包趋势
      </h3>
      <div className="mb-3 flex flex-wrap gap-3">
        {storeMetricsData.map((store, i) => (
          <label
            key={store.storeId}
            className="flex cursor-pointer items-center gap-1.5 font-sans text-xs text-slate-300"
          >
            <input
              type="checkbox"
              checked={selected.has(store.storeId)}
              onChange={() => toggle(store.storeId)}
              className="accent-mint-500"
            />
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: STORE_COLORS[i] }}
            />
            {store.storeName}
          </label>
        ))}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#244A62" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={{ stroke: '#244A62' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={{ stroke: '#244A62' }}
              tickLine={false}
              width={24}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F2B3C',
                border: '1px solid #244A62',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
              }}
              labelStyle={{ color: '#E2E8F0' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, fontFamily: 'Noto Sans SC, sans-serif' }}
            />
            {storeMetricsData.map((store, i) => (
              <Line
                key={store.storeId}
                type="monotone"
                dataKey={store.storeId}
                name={store.storeName}
                stroke={STORE_COLORS[i]}
                strokeWidth={2}
                dot={{ r: 3, fill: STORE_COLORS[i] }}
                activeDot={{ r: 5 }}
                hide={!selected.has(store.storeId)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface HourlyChartProps {
  data: HourlySlot[]
}

function HourlyChart({ data }: HourlyChartProps) {
  const getXAxisIndex = (time: string) => {
    return data.findIndex((d) => d.time === time)
  }

  const peakStartIndex = getXAxisIndex('11:00-12:00')
  const peakEndIndex = getXAxisIndex('13:00-14:00')

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="20%">
          <defs>
            <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFA502" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#FFA502" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {peakStartIndex >= 0 && peakEndIndex >= 0 && (
            <ReferenceArea
              x1={data[peakStartIndex].time}
              x2={data[peakEndIndex].time}
              fill="url(#peakGradient)"
              stroke="#FFA502"
              strokeOpacity={0.3}
              strokeDasharray="3 3"
            />
          )}

          <CartesianGrid strokeDasharray="3 3" stroke="#244A62" />
          <XAxis
            dataKey="time"
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            axisLine={{ stroke: '#244A62' }}
            tickLine={false}
            tickFormatter={(value) => {
              const isPeak = NOON_PEAK_SLOTS.includes(value)
              return isPeak ? `${value} ☀️` : value
            }}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#244A62' }}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F2B3C',
              border: '1px solid #244A62',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, monospace',
            }}
            labelStyle={{ color: '#E2E8F0' }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                appointments: '预约量',
                packs: '实际备包',
                shortages: '缺包次数',
                urgent: '加急次数',
              }
              return [value, labels[name] || name]
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: 'Noto Sans SC, sans-serif' }}
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                appointments: '预约量',
                packs: '实际备包',
                shortages: '缺包次数',
                urgent: '加急次数',
              }
              return labels[value] || value
            }}
          />
          <Bar dataKey="appointments" name="预约量" fill="#3B82F6" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`app-${index}`}
                fill={NOON_PEAK_SLOTS.includes(entry.time) ? '#60A5FA' : '#3B82F6'}
              />
            ))}
          </Bar>
          <Bar dataKey="packs" name="实际备包" fill="#00D4AA" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`pack-${index}`}
                fill={NOON_PEAK_SLOTS.includes(entry.time) ? '#34E3BE' : '#00D4AA'}
              />
            ))}
          </Bar>
          <Bar dataKey="shortages" name="缺包次数" fill="#FF4757" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`short-${index}`}
                fill={NOON_PEAK_SLOTS.includes(entry.time) ? '#FF6B7A' : '#FF4757'}
              />
            ))}
          </Bar>
          <Bar dataKey="urgent" name="加急次数" fill="#FFA502" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`urgent-${index}`}
                fill={NOON_PEAK_SLOTS.includes(entry.time) ? '#FFB74D' : '#FFA502'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface DrawerPanelProps {
  store: StoreMetrics | null
  isOpen: boolean
  onClose: () => void
}

function DrawerPanel({ store, isOpen, onClose }: DrawerPanelProps) {
  if (!store) return null

  const totalAppointments = store.hourlyDetail.reduce((sum, d) => sum + d.appointments, 0)
  const totalPacks = store.hourlyDetail.reduce((sum, d) => sum + d.packs, 0)
  const totalShortages = store.hourlyDetail.reduce((sum, d) => sum + d.shortages, 0)
  const totalUrgent = store.hourlyDetail.reduce((sum, d) => sum + d.urgent, 0)
  const totalGap = totalPacks - totalAppointments

  return (
    <>
      <div
        className={`fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[700px] bg-navy-950 border-l border-navy-700/50 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700/50">
            <h2 className="font-sans text-lg font-semibold text-slate-100">
              {store.storeName}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="font-sans text-base font-medium text-slate-200 mb-4">
              今日时段明细
            </h3>

            <div className="grid grid-cols-5 gap-3 mb-6">
              <div className="rounded-lg border border-navy-700/50 bg-navy-900 p-3">
                <div className="font-mono text-xs text-slate-400 mb-1">总预约</div>
                <div className="font-mono text-lg font-semibold text-slate-200">
                  {totalAppointments}
                </div>
              </div>
              <div className="rounded-lg border border-navy-700/50 bg-navy-900 p-3">
                <div className="font-mono text-xs text-slate-400 mb-1">总备包</div>
                <div className="font-mono text-lg font-semibold text-mint-500">
                  {totalPacks}
                </div>
              </div>
              <div className="rounded-lg border border-navy-700/50 bg-navy-900 p-3">
                <div className="font-mono text-xs text-slate-400 mb-1">总包差</div>
                <div
                  className={`font-mono text-lg font-semibold ${
                    totalGap >= 0 ? 'text-mint-500' : 'text-warn-red'
                  }`}
                >
                  {totalGap >= 0 ? '+' : ''}
                  {totalGap}
                </div>
              </div>
              <div className="rounded-lg border border-navy-700/50 bg-navy-900 p-3">
                <div className="font-mono text-xs text-slate-400 mb-1">总缺包</div>
                <div className="font-mono text-lg font-semibold text-warn-red">
                  {totalShortages}
                </div>
              </div>
              <div className="rounded-lg border border-navy-700/50 bg-navy-900 p-3">
                <div className="font-mono text-xs text-slate-400 mb-1">总加急</div>
                <div className="font-mono text-lg font-semibold text-warn-amber">
                  {totalUrgent}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-navy-700/50 bg-navy-900 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-sans text-sm font-medium text-slate-200">
                  时段对比分析
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="inline-block w-3 h-3 rounded-sm bg-warn-amber/20 border border-warn-amber/30" />
                  <span>午高峰时段</span>
                </div>
              </div>
              <HourlyChart data={store.hourlyDetail} />
            </div>

            <div className="space-y-2">
              {store.hourlyDetail.map((slot, index) => (
                <div
                  key={slot.time}
                  className={`rounded-lg border p-3 transition-colors ${
                    NOON_PEAK_SLOTS.includes(slot.time)
                      ? 'border-warn-amber/30 bg-warn-amber/5'
                      : 'border-navy-700/50 bg-navy-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium text-slate-200">
                      {slot.time}
                      {NOON_PEAK_SLOTS.includes(slot.time) && (
                        <span className="ml-2 text-xs text-warn-amber">午高峰</span>
                      )}
                    </span>
                    <span
                      className={`font-mono text-xs ${
                        slot.packs - slot.appointments >= 0
                          ? 'text-mint-500'
                          : 'text-warn-red'
                      }`}
                    >
                      包差: {slot.packs - slot.appointments >= 0 ? '+' : ''}
                      {slot.packs - slot.appointments}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-400">预约:</span>
                      <span className="text-slate-200">{slot.appointments}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-mint-500" />
                      <span className="text-slate-400">备包:</span>
                      <span className="text-slate-200">{slot.packs}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-warn-red" />
                      <span className="text-slate-400">缺包:</span>
                      <span className="text-slate-200">{slot.shortages}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-warn-amber" />
                      <span className="text-slate-400">加急:</span>
                      <span className="text-slate-200">{slot.urgent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Overview() {
  const [selectedStore, setSelectedStore] = useState<StoreMetrics | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleStoreClick = (store: StoreMetrics) => {
    setSelectedStore(store)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setTimeout(() => {
      setSelectedStore(null)
    }, 300)
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h1 className="font-sans text-xl font-semibold text-slate-100">
          门店备包总览
        </h1>
        <p className="mt-1 font-sans text-sm text-slate-400">
          实时监控各门店备包效率与周转风险
        </p>
      </div>

      {noonPeakStores.length > 0 && <NoonPeakAlert />}

      <div className="grid grid-cols-5 gap-3">
        {storeMetricsData.map((store, i) => (
          <StoreCard
            key={store.storeId}
            store={store}
            color={STORE_COLORS[i]}
            onClick={() => handleStoreClick(store)}
          />
        ))}
      </div>

      <TrendChart />

      <DrawerPanel
        store={selectedStore}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  )
}
