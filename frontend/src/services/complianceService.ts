import api from './api';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriteria: string;
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface ComplianceViolation {
  ruleId: string;
  wcagLevel: string;
  criterion: string;
  impact: string;
  description: string;
  element: string;
  suggestion?: string;
}

export interface ComplianceReport {
  url: string;
  generatedAt: string;
  overallScore: number;
  levelAScore: number;
  levelAAScore: number;
  levelAAAScore: number;
  perceivableScore: number;
  operableScore: number;
  understandableScore: number;
  robustScore: number;
  violations: ComplianceViolation[];
}

// WCAG 2.1 Rules
const complianceRules: ComplianceRule[] = [
  {
    id: 'text-alternatives',
    name: 'Text Alternatives',
    description: 'Provide text alternatives for non-text content',
    wcagLevel: 'A',
    wcagCriteria: '1.1.1',
    category: 'perceivable',
    impact: 'critical',
  },
  // ... existing code ...
];

function toCamelCaseReport(report: any): ComplianceReport {
  return {
    url: report.url,
    generatedAt: report.generated_at,
    overallScore: report.overall_score,
    levelAScore: report.level_a_score,
    levelAAScore: report.level_aa_score,
    levelAAAScore: report.level_aaa_score,
    perceivableScore: report.perceivable_score,
    operableScore: report.operable_score,
    understandableScore: report.understandable_score,
    robustScore: report.robust_score,
    violations: report.violations.map((v: any) => ({
      ruleId: v.rule_id,
      wcagLevel: v.wcag_level,
      criterion: v.criterion,
      impact: v.impact,
      description: v.description,
      element: v.element,
      suggestion: v.suggestion
    }))
  };
}

export const complianceService = {
  async generateReport(projectId: string): Promise<ComplianceReport> {
    const response = await api.post(`/api/projects/${projectId}/compliance`);
    return toCamelCaseReport(response.data);
  },

  async getProjectReports(projectId: string): Promise<ComplianceReport[]> {
    const response = await api.get(`/api/projects/${projectId}/compliance`);
    return response.data.map(toCamelCaseReport);
  },

  async getReport(reportId: string): Promise<ComplianceReport> {
    const response = await api.get(`/api/compliance/${reportId}`);
    return toCamelCaseReport(response.data);
  }
}; 