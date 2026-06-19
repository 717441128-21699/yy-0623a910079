import type {
  StoreMetrics,
  PackTypeUtilization,
  AnomalyStore,
  AnomalyTimeSlot,
  FrequentInstrument,
  ReviewRecord,
  WeeklyReport,
  HourlySlot,
} from '@/types'

const generateHourlyDetail = (storeId: string): HourlySlot[] => {
  const isTroubleStore = ['S001', 'S003', 'S005'].includes(storeId)
  const baseShortage = isTroubleStore ? [0, 1, 0, 2, 3, 2, 1, 0] : [0, 0, 0, 0, 1, 0, 0, 0]
  const baseUrgent = isTroubleStore ? [0, 1, 0, 1, 2, 1, 1, 0] : [0, 0, 0, 0, 0, 0, 0, 0]

  return [
    { time: '09:00-10:00', appointments: 5, packs: 5, shortages: baseShortage[0], urgent: baseUrgent[0] },
    { time: '10:00-11:00', appointments: 8, packs: 7, shortages: baseShortage[1], urgent: baseUrgent[1] },
    { time: '11:00-12:00', appointments: 10, packs: 8, shortages: baseShortage[2], urgent: baseUrgent[2] },
    { time: '12:00-13:00', appointments: 6, packs: 4, shortages: baseShortage[3], urgent: baseUrgent[3] },
    { time: '13:00-14:00', appointments: 7, packs: 5, shortages: baseShortage[4], urgent: baseUrgent[4] },
    { time: '14:00-15:00', appointments: 6, packs: 5, shortages: baseShortage[5], urgent: baseUrgent[5] },
    { time: '15:00-16:00', appointments: 5, packs: 5, shortages: baseShortage[6], urgent: baseUrgent[6] },
    { time: '16:00-17:00', appointments: 5, packs: 5, shortages: baseShortage[7], urgent: baseUrgent[7] },
  ]
}

export const storeMetricsData: StoreMetrics[] = [
  {
    storeId: 'S001',
    storeName: '朝阳旗舰店',
    todayAppointments: 42,
    actualPacks: 38,
    shortageCount: 5,
    urgentCount: 3,
    isNoonPeakShortage: true,
    trend7Days: [
      { date: '06-14', shortageCount: 2 },
      { date: '06-15', shortageCount: 3 },
      { date: '06-16', shortageCount: 1 },
      { date: '06-17', shortageCount: 4 },
      { date: '06-18', shortageCount: 5 },
      { date: '06-19', shortageCount: 3 },
      { date: '06-20', shortageCount: 5 },
    ],
    hourlyDetail: generateHourlyDetail('S001'),
  },
  {
    storeId: 'S002',
    storeName: '海淀学院路店',
    todayAppointments: 35,
    actualPacks: 33,
    shortageCount: 2,
    urgentCount: 1,
    isNoonPeakShortage: false,
    trend7Days: [
      { date: '06-14', shortageCount: 1 },
      { date: '06-15', shortageCount: 0 },
      { date: '06-16', shortageCount: 2 },
      { date: '06-17', shortageCount: 1 },
      { date: '06-18', shortageCount: 3 },
      { date: '06-19', shortageCount: 2 },
      { date: '06-20', shortageCount: 2 },
    ],
    hourlyDetail: generateHourlyDetail('S002'),
  },
  {
    storeId: 'S003',
    storeName: '西城金融街店',
    todayAppointments: 38,
    actualPacks: 30,
    shortageCount: 8,
    urgentCount: 5,
    isNoonPeakShortage: true,
    trend7Days: [
      { date: '06-14', shortageCount: 4 },
      { date: '06-15', shortageCount: 6 },
      { date: '06-16', shortageCount: 5 },
      { date: '06-17', shortageCount: 7 },
      { date: '06-18', shortageCount: 8 },
      { date: '06-19', shortageCount: 6 },
      { date: '06-20', shortageCount: 8 },
    ],
    hourlyDetail: generateHourlyDetail('S003'),
  },
  {
    storeId: 'S004',
    storeName: '东城王府井店',
    todayAppointments: 28,
    actualPacks: 27,
    shortageCount: 1,
    urgentCount: 0,
    isNoonPeakShortage: false,
    trend7Days: [
      { date: '06-14', shortageCount: 0 },
      { date: '06-15', shortageCount: 1 },
      { date: '06-16', shortageCount: 0 },
      { date: '06-17', shortageCount: 1 },
      { date: '06-18', shortageCount: 0 },
      { date: '06-19', shortageCount: 1 },
      { date: '06-20', shortageCount: 1 },
    ],
    hourlyDetail: generateHourlyDetail('S004'),
  },
  {
    storeId: 'S005',
    storeName: '丰台科技园店',
    todayAppointments: 31,
    actualPacks: 26,
    shortageCount: 6,
    urgentCount: 4,
    isNoonPeakShortage: true,
    trend7Days: [
      { date: '06-14', shortageCount: 3 },
      { date: '06-15', shortageCount: 4 },
      { date: '06-16', shortageCount: 5 },
      { date: '06-17', shortageCount: 3 },
      { date: '06-18', shortageCount: 6 },
      { date: '06-19', shortageCount: 4 },
      { date: '06-20', shortageCount: 6 },
    ],
    hourlyDetail: generateHourlyDetail('S005'),
  },
]

export const packTypeUtilizationData: PackTypeUtilization[] = [
  { packType: '洁牙包', utilizationRate: 42, totalPacks: 20, usedPacks: 8, status: 'surplus' },
  { packType: '根管包', utilizationRate: 71, totalPacks: 15, usedPacks: 11, status: 'normal' },
  { packType: '外科包', utilizationRate: 95, totalPacks: 10, usedPacks: 9, status: 'tight' },
  { packType: '正畸包', utilizationRate: 68, totalPacks: 12, usedPacks: 8, status: 'normal' },
  { packType: '修复包', utilizationRate: 88, totalPacks: 8, usedPacks: 7, status: 'tight' },
  { packType: '种植包', utilizationRate: 92, totalPacks: 6, usedPacks: 5, status: 'tight' },
]

export const anomalyStoreData: AnomalyStore[] = [
  { storeId: 'S003', storeName: '西城金融街店', shortageCount: 8, shortageRate: 21.1 },
  { storeId: 'S005', storeName: '丰台科技园店', shortageCount: 6, shortageRate: 19.4 },
  { storeId: 'S001', storeName: '朝阳旗舰店', shortageCount: 5, shortageRate: 11.9 },
  { storeId: 'S002', storeName: '海淀学院路店', shortageCount: 2, shortageRate: 5.7 },
  { storeId: 'S004', storeName: '东城王府井店', shortageCount: 1, shortageRate: 3.6 },
]

export const anomalyTimeSlotData: AnomalyTimeSlot[] = [
  { timeSlot: '周一 10:00-12:00', shortageCount: 12 },
  { timeSlot: '周五 14:00-16:00', shortageCount: 10 },
  { timeSlot: '周三 11:00-13:00', shortageCount: 9 },
  { timeSlot: '周二 09:00-11:00', shortageCount: 7 },
  { timeSlot: '周四 13:00-15:00', shortageCount: 6 },
  { timeSlot: '周六 10:00-12:00', shortageCount: 5 },
  { timeSlot: '周一 14:00-16:00', shortageCount: 4 },
  { timeSlot: '周三 15:00-17:00', shortageCount: 3 },
]

export const frequentInstrumentData: FrequentInstrument[] = [
  { instrumentName: '外科拔牙钳', shortageCount: 14, relatedPackTypes: ['外科包'] },
  { instrumentName: '种植机头', shortageCount: 11, relatedPackTypes: ['种植包'] },
  { instrumentName: '修复取模托盘', shortageCount: 9, relatedPackTypes: ['修复包'] },
  { instrumentName: '高速涡轮手机', shortageCount: 8, relatedPackTypes: ['外科包', '根管包'] },
  { instrumentName: '根管锉套装', shortageCount: 7, relatedPackTypes: ['根管包'] },
  { instrumentName: '正畸托槽镊', shortageCount: 5, relatedPackTypes: ['正畸包'] },
  { instrumentName: '银汞充填器', shortageCount: 4, relatedPackTypes: ['修复包'] },
  { instrumentName: '洁牙工作尖', shortageCount: 3, relatedPackTypes: ['洁牙包'] },
  { instrumentName: '光固化灯', shortageCount: 3, relatedPackTypes: ['修复包'] },
  { instrumentName: '印模材料枪', shortageCount: 2, relatedPackTypes: ['修复包'] },
]

export const initialReviewRecords: ReviewRecord[] = [
  {
    id: 'R001',
    storeId: 'S003',
    storeName: '西城金融街店',
    eventTime: '2026-06-20 11:30',
    packType: '外科包',
    reason: '消毒锅排程',
    note: '上午消毒锅故障，外科包消毒延迟2小时',
    createdBy: '张护士长',
    createdAt: '2026-06-20 14:00',
  },
  {
    id: 'R002',
    storeId: 'S003',
    storeName: '西城金融街店',
    eventTime: '2026-06-20 12:15',
    packType: '种植包',
    reason: '预约变更',
    note: '临时增加一台种植手术，种植包库存不足',
    createdBy: '张护士长',
    createdAt: '2026-06-20 14:30',
  },
  {
    id: 'R003',
    storeId: 'S005',
    storeName: '丰台科技园店',
    eventTime: '2026-06-20 10:00',
    packType: '修复包',
    reason: '器械损坏',
    note: '修复取模托盘消毒时发现裂纹，需更换',
    createdBy: '李护士长',
    createdAt: '2026-06-20 11:00',
  },
  {
    id: 'R004',
    storeId: 'S001',
    storeName: '朝阳旗舰店',
    eventTime: '2026-06-20 11:45',
    packType: '外科包',
    reason: '人员漏备',
    note: '新护士未按清单备齐外科包拔牙钳',
    createdBy: '王护士长',
    createdAt: '2026-06-20 13:00',
  },
  {
    id: 'R005',
    storeId: 'S005',
    storeName: '丰台科技园店',
    eventTime: '2026-06-20 13:30',
    packType: '外科包',
    reason: '预约变更',
    note: '患者临时从洁牙改为拔牙，需加急备外科包',
    createdBy: '李护士长',
    createdAt: '2026-06-20 14:15',
  },
  {
    id: 'R006',
    storeId: 'S001',
    storeName: '朝阳旗舰店',
    eventTime: '2026-06-19 14:00',
    packType: '修复包',
    reason: '消毒锅排程',
    note: '下午消毒锅排程与预约高峰冲突，修复包延迟',
    createdBy: '王护士长',
    createdAt: '2026-06-19 15:30',
  },
  {
    id: 'R007',
    storeId: 'S003',
    storeName: '西城金融街店',
    eventTime: '2026-06-19 10:30',
    packType: '种植包',
    reason: '器械损坏',
    note: '种植机头故障送修，备用不足',
    createdBy: '张护士长',
    createdAt: '2026-06-19 12:00',
  },
  {
    id: 'R008',
    storeId: 'S002',
    storeName: '海淀学院路店',
    eventTime: '2026-06-19 11:00',
    packType: '根管包',
    reason: '人员漏备',
    note: '实习生漏备根管锉套装',
    createdBy: '赵护士长',
    createdAt: '2026-06-19 12:30',
  },
]

export const weeklyReportData: WeeklyReport = {
  weekRange: '2026-06-14 ~ 2026-06-20',
  totalShortages: 22,
  topShortageStores: [
    { storeId: 'S003', storeName: '西城金融街店', shortageCount: 8, shortageRate: 21.1 },
    { storeId: 'S005', storeName: '丰台科技园店', shortageCount: 6, shortageRate: 19.4 },
    { storeId: 'S001', storeName: '朝阳旗舰店', shortageCount: 5, shortageRate: 11.9 },
  ],
  topShortageTimeSlots: [
    { timeSlot: '周一 10:00-12:00', shortageCount: 12 },
    { timeSlot: '周五 14:00-16:00', shortageCount: 10 },
    { timeSlot: '周三 11:00-13:00', shortageCount: 9 },
  ],
  topMissingInstruments: [
    { instrumentName: '外科拔牙钳', shortageCount: 14, relatedPackTypes: ['外科包'] },
    { instrumentName: '种植机头', shortageCount: 11, relatedPackTypes: ['种植包'] },
    { instrumentName: '修复取模托盘', shortageCount: 9, relatedPackTypes: ['修复包'] },
  ],
  reasonDistribution: [
    { reason: '预约变更', count: 7, percentage: 31.8 },
    { reason: '消毒锅排程', count: 6, percentage: 27.3 },
    { reason: '器械损坏', count: 5, percentage: 22.7 },
    { reason: '人员漏备', count: 4, percentage: 18.2 },
  ],
  suggestions: [
    { type: '增配包', target: '西城金融街店', description: '建议增配2套外科包和1套种植包，该门店本周缺包率持续最高，外科包和种植包长期紧张' },
    { type: '调整备包时间', target: '丰台科技园店', description: '建议将消毒锅排程从9:00提前至7:30，确保午高峰前外科包和修复包完成消毒' },
    { type: '培训新护士', target: '朝阳旗舰店', description: '本周发生2次人员漏备事件，建议对新入职护士进行备包清单专项培训' },
    { type: '增配包', target: '全部门店', description: '种植包利用率92%且无闲置，建议各门店增配1套种植包作为应急储备' },
    { type: '调整备包时间', target: '西城金融街店', description: '周一上午为缺包高频时段，建议周一备包量提升20%并提前完成消毒' },
  ],
}

export const storeOptions = [
  { id: 'S001', name: '朝阳旗舰店' },
  { id: 'S002', name: '海淀学院路店' },
  { id: 'S003', name: '西城金融街店' },
  { id: 'S004', name: '东城王府井店' },
  { id: 'S005', name: '丰台科技园店' },
]

export const packTypeOptions = ['洁牙包', '根管包', '外科包', '正畸包', '修复包', '种植包']
