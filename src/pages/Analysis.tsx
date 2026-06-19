import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Package, AlertTriangle, Clock, Wrench } from 'lucide-react'
import {
  packTypeUtilizationData,
  anomalyStoreData,
  anomalyTimeSlotData,
  frequentInstrumentData,
} from '@/data/mockData'

const statusConfig: Record<string, { color: string; label: string; bg: string }> = {
  surplus: { color: '#00D4AA', label: '闲置', bg: 'rgba(0,212,170,0.15)' },
  normal: { color: '#FFA502', label: '适中', bg: 'rgba(255,165,2,0.15)' },
  tight: { color: '#FF4757', label: '紧张', bg: 'rgba(255,71,87,0.15)' },
}

const rankBorderColors = ['#FFD700', '#C0C0C0', '#CD7F32']

function UtilizationOverview() {
  const chartData = packTypeUtilizationData.map((item) => ({
    name: item.packType,
    value: item.utilizationRate,
    status: item.status,
  }))

  return (
    <div className="bg-navy-900 border border-navy-700/50 rounded-lg p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Package size={18} className="text-mint-500" />
        <h3 className="text-white font-semibold text-sm">包型利用率总览</h3>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 60 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={56}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F2B3C',
                border: '1px solid rgba(36,74,98,0.5)',
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: '#E2E8F0' }}
              itemStyle={{ color: '#94A3B8' }}
              formatter={(value: number, _name: string, props: { payload: { status: string } }) => {
                const s = statusConfig[props.payload.status]
                return [`${value}% ${s?.label ?? ''}`, '利用率']
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={statusConfig[entry.status]?.color ?? '#00D4AA'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-3">
          {packTypeUtilizationData.map((item) => {
            const cfg = statusConfig[item.status]
            return (
              <div key={item.packType} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 w-14">{item.packType}</span>
                <div className="flex-1 mx-3 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.utilizationRate}%`,
                      backgroundColor: cfg.color,
                    }}
                  />
                </div>
                <span
                  className="font-mono px-1.5 py-0.5 rounded text-[10px]"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  {cfg.label} {item.utilizationRate}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AnomalyStoreRanking() {
  return (
    <div className="bg-navy-900 border border-navy-700/50 rounded-lg p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-warn-amber" />
        <h3 className="text-white font-semibold text-sm">异常门店排行</h3>
      </div>
      <div className="flex-1 space-y-2.5">
        {anomalyStoreData.map((store, index) => (
          <div
            key={store.storeId}
            className="flex items-center gap-3 bg-navy-800/60 rounded-lg px-3.5 py-3"
            style={
              index < 3
                ? { borderLeft: `3px solid ${rankBorderColors[index]}` }
                : undefined
            }
          >
            <span
              className="font-mono text-sm font-bold w-6 text-center shrink-0"
              style={{ color: index < 3 ? rankBorderColors[index] : '#64748B' }}
            >
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{store.storeName}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="font-mono text-warn-red text-sm font-semibold">
                  {store.shortageCount}
                </p>
                <p className="text-[10px] text-slate-500">缺包次数</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-warn-amber text-sm font-semibold">
                  {store.shortageRate}%
                </p>
                <p className="text-[10px] text-slate-500">缺包率</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnomalyTimeSlotRanking() {
  const maxCount = Math.max(...anomalyTimeSlotData.map((d) => d.shortageCount))

  function getBarColor(count: number): string {
    const ratio = count / maxCount
    const r = Math.round(26 + (255 - 26) * ratio)
    const g = Math.round(58 + (71 - 58) * (1 - ratio))
    const b = Math.round(79 + (87 - 79) * (1 - ratio))
    return `rgb(${r},${g},${b})`
  }

  return (
    <div className="bg-navy-900 border border-navy-700/50 rounded-lg p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-mint-500" />
        <h3 className="text-white font-semibold text-sm">异常时段排行</h3>
      </div>
      <div className="flex-1 space-y-2">
        {anomalyTimeSlotData.map((slot) => {
          const widthPercent = (slot.shortageCount / maxCount) * 100
          const barColor = getBarColor(slot.shortageCount)
          return (
            <div key={slot.timeSlot} className="flex items-center gap-3">
              <span className="text-slate-400 text-xs w-36 shrink-0 truncate">
                {slot.timeSlot}
              </span>
              <div className="flex-1 h-6 bg-navy-800/60 rounded overflow-hidden relative">
                <div
                  className="h-full rounded flex items-center px-2 transition-all"
                  style={{ width: `${widthPercent}%`, backgroundColor: barColor }}
                >
                  <span className="font-mono text-[10px] text-white/90 font-semibold">
                    {slot.shortageCount}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-navy-700/30">
        <span className="text-[10px] text-slate-500">低频</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => {
            const ratio = i / 7
            const r = Math.round(26 + (255 - 26) * ratio)
            const g = Math.round(58 + (71 - 58) * (1 - ratio))
            const b = Math.round(79 + (87 - 79) * (1 - ratio))
            return (
              <div
                key={i}
                className="w-5 h-2.5 rounded-sm"
                style={{ backgroundColor: `rgb(${r},${g},${b})` }}
              />
            )
          })}
        </div>
        <span className="text-[10px] text-slate-500">高频</span>
      </div>
    </div>
  )
}

function FrequentInstrumentRanking() {
  const maxCount = Math.max(...frequentInstrumentData.map((d) => d.shortageCount))

  function getBarColor(count: number): string {
    const ratio = count / maxCount
    const r = Math.round(180 + 75 * ratio)
    const g = Math.round(60 + 17 * (1 - ratio))
    const b = Math.round(60 + 27 * (1 - ratio))
    return `rgb(${r},${g},${b})`
  }

  const chartData = frequentInstrumentData.map((item) => ({
    name: item.instrumentName,
    value: item.shortageCount,
    packTypes: item.relatedPackTypes.join('、'),
  }))

  return (
    <div className="bg-navy-900 border border-navy-700/50 rounded-lg p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Wrench size={18} className="text-warn-red" />
        <h3 className="text-white font-semibold text-sm">常缺器械排行</h3>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F2B3C',
                border: '1px solid rgba(36,74,98,0.5)',
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: '#E2E8F0' }}
              itemStyle={{ color: '#94A3B8' }}
              formatter={(value: number, _name: string, props: { payload: { packTypes: string } }) => [
                `${value} 次 (关联: ${props.payload.packTypes})`,
                '缺包次数',
              ]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 mt-2">
          {frequentInstrumentData.slice(0, 5).map((item) => (
            <div key={item.instrumentName} className="flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate">{item.instrumentName}</span>
              <span className="font-mono text-slate-500 shrink-0 ml-2">
                {item.relatedPackTypes.join('、')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Analysis() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">包型利用率分析</h2>
        <p className="text-sm text-slate-400 mt-1">识别包型配置不均衡与异常模式</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <UtilizationOverview />
        <AnomalyStoreRanking />
        <AnomalyTimeSlotRanking />
        <FrequentInstrumentRanking />
      </div>
    </div>
  )
}
