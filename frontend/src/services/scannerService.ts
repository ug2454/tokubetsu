import api from './api';

export interface ScanResult {
  url: string;
  timestamp: string;
  violations: Violation[];
  passes: number;
  score: number;
}

export interface Violation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  nodes: string[];
  help: string;
  helpUrl: string;
}

interface RawViolation {
  id?: string;
  impact?: string;
  description?: string;
  help?: string;
  helpUrl?: string;
  nodes?: string[];
}

export const scannerService = {
  async scanUrl(url: string): Promise<ScanResult> {
    console.log('=== Scan Request Details ===');
    console.log('Original URL received by scannerService:', url);
    console.log('URL type:', typeof url);
    console.log('URL length:', url.length);
    
    try {
      // Ensure URL has proper scheme
      const targetUrl = url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;

      console.log('URL transformation:');
      console.log('- Original:', url);
      console.log('- After scheme check:', targetUrl);
      console.log('- Encoded:', encodeURIComponent(targetUrl));

      // Use the public scan endpoint that doesn't require authentication
      const apiUrl = `/api/public/scan?url=${encodeURIComponent(targetUrl)}`;
      console.log('Final API request URL:', apiUrl);
      
      const response = await api.get(apiUrl);
      console.log('API Response:', response.data);

      // Ensure we have valid data
      const violations = Array.isArray(response.data.violations) ? response.data.violations : [];
      const passes = typeof response.data.passes === 'number' ? response.data.passes : 0;
      const score = typeof response.data.score === 'number' ? response.data.score : 0;

      // Log the processed results
      console.log('Processed scan results:', {
        violations: violations.length,
        passes,
        score
      });

      // Validate each violation object
      const validatedViolations = violations.map((violation: RawViolation) => {
        console.log('Processing violation:', violation.description);
        console.log('Nodes data:', violation.nodes);
        if (violation.nodes && violation.nodes.length > 0) {
          console.log('First node length:', violation.nodes[0].length);
          console.log('First node sample:', violation.nodes[0].substring(0, 100));
        }
        
        return {
          id: violation.id || 'unknown',
          impact: violation.impact || 'unknown',
          description: violation.description || 'No description available',
          help: violation.help || 'No help available',
          helpUrl: violation.helpUrl || '#',
          nodes: Array.isArray(violation.nodes) 
            ? violation.nodes
            : ['Unknown element']
        };
      });

      return {
        url: targetUrl,
        timestamp: new Date().toISOString(),
        violations: validatedViolations,
        passes,
        score
      };
    } catch (error: any) {
      console.error('Scan Error Details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        stack: error?.stack
      });

      // Check if error is related to X-Frame-Options
      if (error?.response?.data?.error?.includes('X-Frame-Options')) {
        throw new Error(
          'This website cannot be scanned due to security restrictions. ' +
          'The website has set X-Frame-Options to deny external access. ' +
          'Please try scanning a different website or contact the website administrator.'
        );
      }

      // Return a default scan result with empty violations on error
      return {
        url: url,
        timestamp: new Date().toISOString(),
        violations: [],
        passes: 0,
        score: 0
      };
    }
    }
}; 