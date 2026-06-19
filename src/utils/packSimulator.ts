import type { PackTypeUtilization, AnomalyStore, BudgetRecommendation } from '@/types'
import { packTypeUtilizationData, anomalyStoreData } from '@/data/mockData'

export interface SimulationResult {
  originalData: PackTypeUtilization[]
  adjustedData: PackTypeUtilization[]
  originalTightCount: number
  adjustedTightCount: number
  riskReduction: number
  affectedStores: { storeName: string; originalShortages: number; estimatedShortages: number; reduction: number }[]
  utilizationChanges: {
    packType: string
    originalRate: number
    adjustedRate: number
    originalStatus: string
    adjustedStatus: string
  }[]
}

export function runPackSimulation(
  packAdjustments: Record<string, number>
): SimulationResult {
  const originalData = [...packTypeUtilizationData]
  const adjustedData = originalData.map((item) => ({ ...item }))

  Object.entries(packAdjustments).forEach(([packType, addCount]) => {
    if (addCount <= 0) return
    const item = adjustedData.find((d) => d.packType === packType)
    if (!item) return

    const newTotalPacks = item.totalPacks + addCount
    const newUtilizationRate = Math.round((item.usedPacks / newTotalPacks) * 100)

    item.totalPacks = newTotalPacks
    item.utilizationRate = newUtilizationRate
    item.status = newUtilizationRate <= 60 ? 'surplus' : newUtilizationRate <= 85 ? 'normal' : 'tight'
  })

  const originalTightCount = originalData.filter((d) => d.status === 'tight').length
  const adjustedTightCount = adjustedData.filter((d) => d.status === 'tight').length
  const riskReduction =
    originalTightCount > 0 ? Math.round(((originalTightCount - adjustedTightCount) / originalTightCount) * 100) : 0

  const utilizationChanges = adjustedData.map((item, index) => {
    const original = originalData[index]
    return {
      packType: item.packType,
      originalRate: original.utilizationRate,
      adjustedRate: item.utilizationRate,
      originalStatus: original.status,
      adjustedStatus: item.status,
    }
  })

  const adjustedPackTypes = Object.keys(packAdjustments).filter((k) => packAdjustments[k] > 0)
  const affectedStores = anomalyStoreData
    .filter((s) => s.shortageCount >= 3)
    .map((s) => {
      const originalShortages = s.shortageCount
      let estimatedShortages = originalShortages

      adjustedPackTypes.forEach((pt) => {
        if (
          (pt === '外科包' && s.storeId === 'S003') ||
          (pt === '种植包' && s.storeId === 'S001') ||
          (pt === '修复包' && s.storeId === 'S005')
        ) {
          estimatedShortages = Math.max(0, estimatedShortages - Math.ceil(originalShortages * 0.4))
        } else if (packAdjustments[pt] >= 2) {
          estimatedShortages = Math.max(0, estimatedShortages - Math.ceil(originalShortages * 0.2))
        }
      })

      return {
        storeName: s.storeName,
        originalShortages,
        estimatedShortages,
        reduction: originalShortages - estimatedShortages,
      }
    })
    .filter((s) => s.reduction > 0)

  return {
    originalData,
    adjustedData,
    originalTightCount,
    adjustedTightCount,
    riskReduction,
    affectedStores,
    utilizationChanges,
  }
}

export function getRecommendation(packType: string, currentUtilization: number): string {
  if (currentUtilization >= 90) {
    return `该包型利用率高达${currentUtilization}%，建议立即增配2-3套`
  } else if (currentUtilization >= 80) {
    return `该包型利用率${currentUtilization}%，建议增配1套作为备用`
  } else if (currentUtilization >= 60) {
    return `该包型利用率${currentUtilization}%，当前配置合理，可维持现状`
  } else {
    return `该包型利用率仅${currentUtilization}%，存在闲置，可考虑减少配置`
  }
}

export function estimateCost(packType: string, count: number): number {
  const costMap: Record<string, number> = {
    洁牙包: 120,
    根管包: 280,
    外科包: 450,
    正畸包: 380,
    修复包: 320,
    种植包: 680,
  }
  return (costMap[packType] || 300) * count
}

export function generateBudgetRecommendation(budget: number): BudgetRecommendation {
  const costMap: Record<string, number> = {
    洁牙包: 120,
    根管包: 280,
    外科包: 450,
    正畸包: 380,
    修复包: 320,
    种植包: 680,
  }

  const riskReductionPerPack: Record<string, number> = {
    洁牙包: 5,
    根管包: 10,
    外科包: 25,
    正畸包: 8,
    修复包: 15,
    种植包: 20,
  }

  const tightPackTypes = packTypeUtilizationData.filter((p) => p.status === 'tight')
  const normalPackTypes = packTypeUtilizationData.filter((p) => p.status === 'normal' && p.utilizationRate >= 70)

  const candidates = [...tightPackTypes, ...normalPackTypes]
    .map((p) => ({
      packType: p.packType,
      utilizationRate: p.utilizationRate,
      cost: costMap[p.packType] || 300,
      riskReduction: riskReductionPerPack[p.packType] || 10,
      costEfficiency: (riskReductionPerPack[p.packType] || 10) / (costMap[p.packType] || 300),
    }))
    .sort((a, b) => b.costEfficiency - a.costEfficiency)

  const allocations: BudgetRecommendation['allocations'] = []
  let remainingBudget = budget
  let totalCost = 0
  let totalRiskReduction = 0

  for (const candidate of candidates) {
    if (remainingBudget < candidate.cost) continue

    const maxPacks = Math.min(3, Math.floor(remainingBudget / candidate.cost))
    if (maxPacks <= 0) continue

    let addCount = 0
    for (let i = 1; i <= maxPacks; i++) {
      const simulatedUtilization = Math.round(
        (packTypeUtilizationData.find((p) => p.packType === candidate.packType)!.usedPacks /
          (packTypeUtilizationData.find((p) => p.packType === candidate.packType)!.totalPacks + i)) *
          100
      )
      if (simulatedUtilization >= 60) {
        addCount = i
      } else {
        break
      }
    }

    if (addCount > 0) {
      const packCost = candidate.cost * addCount
      const packRiskReduction = candidate.riskReduction * addCount

      if (remainingBudget >= packCost) {
        allocations.push({
          packType: candidate.packType,
          addCount,
          unitCost: candidate.cost,
          totalCost: packCost,
          estimatedRiskReduction: packRiskReduction,
        })
        totalCost += packCost
        remainingBudget -= packCost
        totalRiskReduction += packRiskReduction
      }
    }
  }

  const originalTightCount = packTypeUtilizationData.filter((p) => p.status === 'tight').length
  const adjustedAdjustments: Record<string, number> = {}
  allocations.forEach((a) => {
    adjustedAdjustments[a.packType] = a.addCount
  })
  const simResult = runPackSimulation(adjustedAdjustments)

  return {
    budget,
    totalCost,
    remainingBudget,
    allocations,
    estimatedRiskReduction: Math.min(totalRiskReduction, 100),
    originalTightCount,
    estimatedTightCount: simResult.adjustedTightCount,
  }
}

