import { useState } from 'react'
import { AlertTriangle, Package, Clock, AlertCircle, Zap } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { storeMetricsData } from '@/data/mockData'
import type { StoreMetrics } from '@/types'

const STORE_COLORS = ['#00D4AA', '#3B82F6', '#FFA502', '#A78BFA', '#FF4757']

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

function StoreCard({ store, color }: { store: StoreMetrics; color: string }) {
  return (
    <div className="relative rounded-lg border border-navy-700/50 bg-navy-900 p-4 transition-colors hover:border-navy-600">
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

export default function Overview() {
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
          <StoreCard key={store.storeId} store={store} color={STORE_COLORS[i]} />
        ))}
      </div>

      <TrendChart />
    </div>
  )
}
