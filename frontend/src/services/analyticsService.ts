import api from './api';

export interface ProjectStatusAnalytics {
  active: number;
  inactive: number;
}

export interface ScanHistoryPoint {
  date: string;
  scans: number;
  issues: number;
}

export interface IssueTypeAnalytics {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface AnalyticsData {
  project_status: ProjectStatusAnalytics;
  scan_history: ScanHistoryPoint[];
  issue_types: IssueTypeAnalytics;
  total_scans: number;
  total_issues: number;
}

export const analyticsService = {
  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const response = await api.get('/api/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}; 