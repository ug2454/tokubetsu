import { ComplianceViolation } from './complianceService';
import { FixSuggestion } from './fixSuggestionService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ReportData {
  timestamp: string;
  url?: string;
  violations: ComplianceViolation[];
  compliance: {
    score: number;
    level: string;
    details: Record<string, boolean>;
  };
  fixSuggestions: FixSuggestion[];
  simulationResults?: {
    colorBlindness: Record<string, string>;
    screenReader: string[];
    keyboardNavigation: string[];
  };
}

export const exportService = {
  async generatePDFReport(data: ReportData, element?: HTMLElement): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Add title
    doc.setFontSize(24);
    doc.text('Accessibility Report', margin, margin + 20);

    // Add timestamp
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date(data.timestamp).toLocaleString()}`, margin, margin + 30);

    // Add URL if available
    if (data.url) {
      doc.text(`URL: ${data.url}`, margin, margin + 40);
    }

    // Add compliance score
    doc.setFontSize(16);
    doc.text('Compliance Score', margin, margin + 60);
    doc.setFontSize(12);
    doc.text(`Score: ${data.compliance.score}%`, margin, margin + 70);
    doc.text(`Level: ${data.compliance.level}`, margin, margin + 80);

    // Add violations
    doc.setFontSize(16);
    doc.text('Accessibility Violations', margin, margin + 100);
    doc.setFontSize(12);
    let y = margin + 110;
    data.violations.forEach((violation, index) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(`${index + 1}. ${violation.description}`, margin, y);
      y += 10;
      doc.text(`Impact: ${violation.impact}`, margin, y);
      y += 10;
      doc.text(`Help: ${violation.help}`, margin, y);
      y += 20;
    });

    // Add fix suggestions
    doc.setFontSize(16);
    doc.text('Fix Suggestions', margin, y);
    y += 20;
    doc.setFontSize(12);
    data.fixSuggestions.forEach((suggestion, index) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(`${index + 1}. ${suggestion.description}`, margin, y);
      y += 10;
      doc.text(`Impact: ${suggestion.impact}`, margin, y);
      y += 10;
      doc.text(`Effort: ${suggestion.effort}`, margin, y);
      y += 20;
    });

    // If element is provided, add a screenshot
    if (element) {
      try {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addPage();
        doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error capturing screenshot:', error);
      }
    }

    return doc.output('blob');
  },

  generateJSONReport(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  },

  async generateShareableLink(data: ReportData): Promise<string> {
    // In a real implementation, this would upload the report to a server
    // and return a shareable URL. For now, we'll return a data URL.
    const jsonData = this.generateJSONReport(data);
    return `data:application/json;base64,${btoa(jsonData)}`;
  },
}; 