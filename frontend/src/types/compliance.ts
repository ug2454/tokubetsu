export interface ComplianceViolationItem {
  ID: string; // UUID from Base
  report_id: string; // UUID
  rule_id: string;
  wcag_level: string;
  criterion: string;
  impact: string;
  description: string;
  element: string;
  suggestion?: string;
  CreatedAt: string; // ISO Date string from Base
  UpdatedAt: string; // ISO Date string from Base
}

export interface ComplianceReportItem {
  ID: string; // UUID from Base
  project_id: string; // UUID
  url: string;
  generated_at: string; // ISO Date string
  overall_score: number;
  level_a_score: number;
  level_aa_score: number;
  level_aaa_score: number;
  perceivable_score: number;
  operable_score: number;
  understandable_score: number;
  robust_score: number;
  violations: ComplianceViolationItem[];
  CreatedAt: string; // ISO Date string from Base
  UpdatedAt: string; // ISO Date string from Base
} 