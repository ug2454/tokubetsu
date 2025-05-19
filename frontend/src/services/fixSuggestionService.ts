import { ComplianceViolation } from './complianceService';

export interface FixSuggestion {
  id: string;
  violationId: string;
  description: string;
  before: string;
  after: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'complex';
  automated: boolean;
}

interface FixTemplate {
  pattern: RegExp;
  fix: (match: RegExpMatchArray, element: string) => string;
  description: string;
  impact: FixSuggestion['impact'];
  effort: FixSuggestion['effort'];
  automated: boolean;
}

const fixTemplates: Record<string, FixTemplate[]> = {
  'text-alternatives': [
    {
      pattern: /<img[^>]+>/i,
      fix: (match, element) => {
        const src = element.match(/src="([^"]+)"/)?.[1] || '';
        const alt = element.match(/alt="([^"]+)"/);
        if (!alt) {
          const fileName = src.split('/').pop()?.split('.')[0] || '';
          return element.replace(/<img/, `<img alt="${fileName}"`);
        }
        return element;
      },
      description: 'Add descriptive alt text to images',
      impact: 'high',
      effort: 'easy',
      automated: true,
    },
  ],
  'keyboard-accessible': [
    {
      pattern: /<div[^>]*onclick/i,
      fix: (match, element) => {
        return element
          .replace('<div', '<button type="button"')
          .replace('</div>', '</button>')
          .replace(/onclick/, 'onClick')
          .replace(/role="button"/, '')
          + ' tabIndex={0}';
      },
      description: 'Convert div with click handler to button element',
      impact: 'high',
      effort: 'easy',
      automated: true,
    },
  ],
  'distinguishable': [
    {
      pattern: /color:\s*#([0-9A-F]{6})/i,
      fix: (match, element) => {
        const color = match[1];
        // Add contrast check logic here
        return element;
      },
      description: 'Improve color contrast ratio',
      impact: 'high',
      effort: 'medium',
      automated: false,
    },
  ],
  'adaptable': [
    {
      pattern: /<table[^>]*>/i,
      fix: (match, element) => {
        if (!element.includes('role="table"')) {
          return element.replace('<table', '<table role="table"');
        }
        return element;
      },
      description: 'Add semantic table roles',
      impact: 'medium',
      effort: 'easy',
      automated: true,
    },
  ],
};

export const fixSuggestionService = {
  generateSuggestions(violations: ComplianceViolation[]): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    violations.forEach((violation) => {
      const templates = fixTemplates[violation.ruleId];
      if (!templates) return;

      templates.forEach((template) => {
        if (template.pattern.test(violation.code)) {
          const fixedCode = violation.code.replace(
            template.pattern,
            (match, ...args) => template.fix([match, ...args], violation.code)
          );

          if (fixedCode !== violation.code) {
            suggestions.push({
              id: `${violation.ruleId}-${suggestions.length}`,
              violationId: violation.ruleId,
              description: template.description,
              before: violation.code,
              after: fixedCode,
              impact: template.impact,
              effort: template.effort,
              automated: template.automated,
            });
          }
        }
      });
    });

    return suggestions;
  },

  async applyFix(suggestion: FixSuggestion, documentContent: string): Promise<string> {
    try {
      // Replace the old code with the new code
      return documentContent.replace(suggestion.before, suggestion.after);
    } catch (error) {
      console.error('Failed to apply fix:', error);
      throw new Error('Failed to apply fix');
    }
  },

  async previewFix(suggestion: FixSuggestion, documentContent: string): Promise<string> {
    try {
      // Create a temporary document to preview changes
      const tempDoc = documentContent;
      const fixedDoc = await this.applyFix(suggestion, tempDoc);
      return fixedDoc;
    } catch (error) {
      console.error('Failed to preview fix:', error);
      throw new Error('Failed to preview fix');
    }
  },
}; 