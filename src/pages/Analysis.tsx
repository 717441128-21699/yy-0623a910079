import { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Package, AlertTriangle, Clock, Wrench, Calculator, Minus, Plus, RotateCcw, Check, Wallet, Sparkles } from 'lucide-react'
import {
  packTypeUtilizationData,
  anomalyStoreData,
  anomalyTimeSlotData,
  frequentInstrumentData,
  packTypeOptions,
} from '@/data/mockData'
import {
  runPackSimulation,
  getRecommendation,
  estimateCost,
  generateBudgetRecommendation,
  type SimulationResult,
} from '@/utils/packSimulator'
import type { BudgetRecommendation } from '@/types'

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
        <h3 className="text-white font-semibold text-sm font-sans">包型利用率总览</h3>
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

function PackSimulation() {
  const [simulationTab, setSimulationTab] = useState<'manual' | 'budget'>('manual')
  const [packAdjustments, setPackAdjustments] = useState<Record<string, number>>({})
  const [budget, setBudget] = useState<number>(3000)
  const [budgetRecommendation, setBudgetRecommendation] = useState<BudgetRecommendation | null>(null)
  const [showApplySuccess, setShowApplySuccess] = useState(false)

  const simulationResult: SimulationResult | null = useMemo(() => {
    const hasAdjustments = Object.values(packAdjustments).some((v) => v > 0)
    if (!hasAdjustments) return null
    return runPackSimulation(packAdjustments)
  }, [packAdjustments])

  const totalCost = useMemo(() => {
    return Object.entries(packAdjustments).reduce((sum, [packType, count]) => {
      return sum + estimateCost(packType, count)
    }, 0)
  }, [packAdjustments])

  const handleAdjust = (packType: string, delta: number) => {
    setPackAdjustments((prev) => {
      const current = prev[packType] || 0
      const newValue = Math.max(0, Math.min(5, current + delta))
      return { ...prev, [packType]: newValue }
    })
  }

  const handleReset = () => {
    setPackAdjustments({})
    setBudgetRecommendation(null)
    setShowApplySuccess(false)
  }

  const handleGenerateRecommendation = () => {
    if (budget > 0) {
      const recommendation = generateBudgetRecommendation(budget)
      setBudgetRecommendation(recommendation)
    }
  }

  const handleApplyRecommendation = () => {
    if (!budgetRecommendation) return

    const newAdjustments: Record<string, number> = {}
    budgetRecommendation.allocations.forEach((alloc) => {
      newAdjustments[alloc.packType] = alloc.addCount
    })
    setPackAdjustments(newAdjustments)
    setShowApplySuccess(true)
    setSimulationTab('manual')

    setTimeout(() => setShowApplySuccess(false), 3000)
  }

  const hasChanges = simulationResult && Object.values(packAdjustments).some((v) => v > 0)
  const quickAmounts = [1000, 2000, 3000, 5000]

  return (
    <div className="bg-navy-900 border border-navy-700/50 rounded-lg p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-mint-500" />
          <h3 className="text-white font-semibold text-sm font-sans">补包模拟</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw size={12} />
          重置
        </button>
      </div>

      <div className="flex bg-navy-800/60 rounded-lg p-1 mb-4">
        <button
          onClick={() => setSimulationTab('manual')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 font-sans ${
            simulationTab === 'manual'
              ? 'bg-mint-500 text-navy-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          手动调整
        </button>
        <button
          onClick={() => setSimulationTab('budget')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200 font-sans ${
            simulationTab === 'budget'
              ? 'bg-mint-500 text-navy-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          预算推荐
        </button>
      </div>

      {showApplySuccess && (
        <div className="mb-3 flex items-center gap-2 bg-mint-500/20 border border-mint-500/50 rounded-lg px-3 py-2 animate-pulse">
          <Check size={14} className="text-mint-500" />
          <span className="text-xs text-mint-400 font-sans">推荐方案已应用到手动调整器</span>
        </div>
      )}

      {simulationTab === 'manual' ? (
        <>
          <div className="space-y-2.5 mb-4">
            {packTypeOptions.map((packType) => {
              const count = packAdjustments[packType] || 0
              const item = packTypeUtilizationData.find((d) => d.packType === packType)
              const cfg = item ? statusConfig[item.status] : null

              return (
                <div
                  key={packType}
                  className="flex items-center justify-between bg-navy-800/60 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs w-14">{packType}</span>
                    {cfg && (
                      <span
                        className="font-mono px-1.5 py-0.5 rounded text-[10px]"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjust(packType, -1)}
                      disabled={count === 0}
                      className="w-6 h-6 rounded bg-navy-700 hover:bg-navy-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      <Minus size={12} className="text-slate-300" />
                    </button>
                    <span className="font-mono text-white text-sm w-6 text-center">{count}</span>
                    <button
                      onClick={() => handleAdjust(packType, 1)}
                      disabled={count === 5}
                      className="w-6 h-6 rounded bg-navy-700 hover:bg-navy-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      <Plus size={12} className="text-slate-300" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {hasChanges && simulationResult && (
            <div className="flex-1 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-800/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 mb-1 font-sans">风险降低</p>
                  <p className="text-2xl font-bold text-mint-500 font-mono">
                    {simulationResult.riskReduction}%
                  </p>
                </div>
                <div className="bg-navy-800/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 mb-1 font-sans">紧张包型</p>
                  <p className="text-sm font-mono text-white">
                    <span className="text-warn-red">{simulationResult.originalTightCount}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className="text-mint-500">{simulationResult.adjustedTightCount}</span>
                  </p>
                  <p className="text-[10px] text-mint-500/70 font-mono">
                    减少 {simulationResult.originalTightCount - simulationResult.adjustedTightCount}
                  </p>
                </div>
              </div>

              {simulationResult.affectedStores.length > 0 && (
                <div className="bg-navy-800/60 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2 font-sans">受影响门店预估</p>
                  <div className="space-y-1.5">
                    {simulationResult.affectedStores.map((store) => (
                      <div key={store.storeName} className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 truncate">{store.storeName}</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-warn-red">{store.originalShortages}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-mint-500">{store.estimatedShortages}</span>
                          <span className="text-mint-500/70 text-[10px]">(-{store.reduction})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-navy-800/60 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2 font-sans">利用率变化</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="text-left pb-1.5 font-normal">包型</th>
                        <th className="text-right pb-1.5 font-normal">原利用率</th>
                        <th className="text-right pb-1.5 font-normal">新利用率</th>
                        <th className="text-right pb-1.5 font-normal">原状态</th>
                        <th className="text-right pb-1.5 font-normal pl-1">新状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResult.utilizationChanges.map((change) => {
                        const isChanged = change.originalRate !== change.adjustedRate
                        const originalCfg = statusConfig[change.originalStatus]
                        const adjustedCfg = statusConfig[change.adjustedStatus]

                        return (
                          <tr
                            key={change.packType}
                            className={isChanged ? 'bg-mint-500/10' : ''}
                          >
                            <td className="py-1 text-slate-300">{change.packType}</td>
                            <td className="py-1 text-right font-mono text-slate-400">
                              {change.originalRate}%
                            </td>
                            <td className="py-1 text-right font-mono text-mint-500">
                              {change.adjustedRate}%
                            </td>
                            <td className="py-1 text-right">
                              <span
                                className="px-1 py-0.5 rounded"
                                style={{
                                  color: originalCfg?.color,
                                  backgroundColor: originalCfg?.bg,
                                }}
                              >
                                {originalCfg?.label}
                              </span>
                            </td>
                            <td className="py-1 text-right pl-1">
                              <span
                                className="px-1 py-0.5 rounded"
                                style={{
                                  color: adjustedCfg?.color,
                                  backgroundColor: adjustedCfg?.bg,
                                }}
                              >
                                {adjustedCfg?.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                {Object.entries(packAdjustments)
                  .filter(([_, count]) => count > 0)
                  .map(([packType, count]) => {
                    const item = packTypeUtilizationData.find((d) => d.packType === packType)
                    if (!item) return null
                    return (
                      <div key={packType} className="bg-navy-800/60 rounded-lg p-3">
                        <p className="text-xs text-mint-500/80 font-sans">
                          {getRecommendation(packType, item.utilizationRate)}
                        </p>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {totalCost > 0 && (
            <div className="mt-3 pt-3 border-t border-navy-700/30 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-sans">预估成本</span>
              <span className="font-mono text-mint-500 font-semibold">¥{totalCost}</span>
            </div>
          )}

          {!simulationResult && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-slate-500 font-sans">调整包型增配数量，查看模拟效果</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={14} className="text-mint-500" />
              <span className="text-xs text-slate-300 font-sans">设置预算上限</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                  ¥
                </span>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-navy-800/60 border border-navy-700/50 rounded-lg pl-8 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-mint-500/50 transition-colors"
                  min={0}
                  step={100}
                />
              </div>
              <button
                onClick={handleGenerateRecommendation}
                className="flex items-center gap-1.5 bg-mint-500 hover:bg-mint-400 text-navy-950 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 font-sans"
              >
                <Sparkles size={14} />
                生成推荐方案
              </button>
            </div>

            <div className="flex gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBudget(amount)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-all duration-200 font-mono ${
                    budget === amount
                      ? 'bg-mint-500 text-navy-950'
                      : 'bg-navy-800/60 text-slate-400 hover:text-white hover:bg-navy-700/60'
                  }`}
                >
                  ¥{amount}
                </button>
              ))}
            </div>
          </div>

          {budgetRecommendation ? (
            <div className="flex-1 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-navy-800/60 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5 font-sans">总预算</p>
                  <p className="text-sm font-bold text-white font-mono">
                    ¥{budgetRecommendation.budget}
                  </p>
                </div>
                <div className="bg-navy-800/60 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5 font-sans">已使用</p>
                  <p className="text-sm font-bold text-mint-500 font-mono">
                    ¥{budgetRecommendation.totalCost}
                  </p>
                </div>
                <div className="bg-navy-800/60 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-slate-500 mb-0.5 font-sans">剩余</p>
                  <p className="text-sm font-bold text-slate-400 font-mono">
                    ¥{budgetRecommendation.remainingBudget}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-800/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 mb-1 font-sans">预估风险降低</p>
                  <p className="text-2xl font-bold text-mint-500 font-mono">
                    {budgetRecommendation.estimatedRiskReduction}%
                  </p>
                </div>
                <div className="bg-navy-800/60 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 mb-1 font-sans">紧张包型</p>
                  <p className="text-sm font-mono text-white">
                    <span className="text-warn-red">{budgetRecommendation.originalTightCount}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className="text-mint-500">{budgetRecommendation.estimatedTightCount}</span>
                  </p>
                  <p className="text-[10px] text-mint-500/70 font-mono">
                    减少 {budgetRecommendation.originalTightCount - budgetRecommendation.estimatedTightCount}
                  </p>
                </div>
              </div>

              <div className="bg-navy-800/60 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2 font-sans">资源分配方案</p>
                <div className="space-y-1">
                  {budgetRecommendation.allocations.map((alloc, index) => (
                    <div
                      key={alloc.packType}
                      className={`flex items-center justify-between py-2 ${
                        index < budgetRecommendation.allocations.length - 1
                          ? 'border-b border-navy-700/30'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-xs w-14">{alloc.packType}</span>
                        <span className="font-mono text-mint-500 text-xs">
                          ×{alloc.addCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-500">¥{alloc.unitCost}/套</span>
                        <span className="text-white">¥{alloc.totalCost}</span>
                        <span className="text-mint-500/80">-{alloc.estimatedRiskReduction}%风险</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleApplyRecommendation}
                className="w-full flex items-center justify-center gap-2 bg-mint-500 hover:bg-mint-400 text-navy-950 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-sans group"
              >
                <Check size={16} className="transition-transform group-hover:rotate-12" />
                应用推荐方案
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Sparkles size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-sans">设置预算后点击生成推荐方案</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AnomalyStoreRanking() {
  return (
    <div className="bg-navy-900 border border-navy-700/50 rounded-lg p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-warn-amber" />
        <h3 className="text-white font-semibold text-sm font-sans">异常门店排行</h3>
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
        <h3 className="text-white font-semibold text-sm font-sans">异常时段排行</h3>
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
    <div className="bg-navy-900 border border-navy-700/50 rounded-lg p-5 flex flex-col col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Wrench size={18} className="text-warn-red" />
        <h3 className="text-white font-semibold text-sm font-sans">常缺器械排行</h3>
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
        <h2 className="text-xl font-bold text-white font-sans">包型利用率分析</h2>
        <p className="text-sm text-slate-400 mt-1 font-sans">识别包型配置不均衡与异常模式</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <UtilizationOverview />
        <PackSimulation />
        <AnomalyStoreRanking />
        <AnomalyTimeSlotRanking />
        <FrequentInstrumentRanking />
      </div>
    </div>
  )
}
