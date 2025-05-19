export interface ActivityLogItem {
  id: string; // UUID
  user_id: string; // UUID
  action: string;
  timestamp: string; // ISO 8601 date string
  project_id?: string; // UUID, optional
  project_name?: string; // Optional
  details?: string; // Optional
  type: string; // e.g., "project", "scan", "user"
} 