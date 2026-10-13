import axiosClient from './axiosClient'
import type { DashboardStatsResponse } from '@/types/dashboard.types'

export const dashboardService = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    const res: any = await axiosClient.get('/api/dashboard/stats')
    // axiosClient interceptor returns response.data directly
    if (res && res.result !== undefined) {
      return res.result as DashboardStatsResponse
    }
    return res as DashboardStatsResponse
  },
}
