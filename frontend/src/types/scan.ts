export interface ScanDashboardItem {
  id: string; // UUID
  project_id: string; // UUID
  project_name: string;
  scan_type: string;
  status: 'completed' | 'failed' | 'in_progress' | 'pending'; // Added 'pending'
  score?: number; // Optional, as in backend
  issues_count: number;
  timestamp: string; // ISO 8601 date string
  summary?: string; // Optional
} 