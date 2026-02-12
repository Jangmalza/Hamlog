import { requestJson } from './client';

export interface VisitorStatsResponse {
  totalVisitors: number;
  todayVisitors: number;
  date: string;
}

export const trackVisitorStats = () =>
  requestJson<VisitorStatsResponse>('/analytics/visitors/track', {
    method: 'POST'
  });
