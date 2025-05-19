import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Code as CodeIcon,
  Visibility as PreviewIcon,
  BugReport as IssuesIcon,
} from '@mui/icons-material';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { scannerService } from '../services/scannerService';
import { complianceService } from '../services/complianceService';
import { simulationService } from '../services/simulationService';
import { FixSuggestion, fixSuggestionService } from '../services/fixSuggestionService';
import { ReportData } from '../services/exportService';
import FixSuggestions from './FixSuggestions';
import SimulationControls from './SimulationControls';
import ExportControls from './ExportControls';

interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialContent = '', onContentChange }) => {
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [violations, setViolations] = useState<any[]>([]);
  const [complianceResults, setComplianceResults] = useState<any>(null);
  const [fixSuggestions, setFixSuggestions] = useState<FixSuggestion[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Debounced scanning function
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (content) {
        setIsScanning(true);
        try {
          // Run accessibility scan
          const scanResults = await scannerService.scan(content);
          setViolations(scanResults.violations);

          // Check compliance
          const compliance = await complianceService.checkCompliance(content);
          setComplianceResults(compliance);

          // Generate fix suggestions
          const suggestions = fixSuggestionService.generateSuggestions(scanResults.violations);
          setFixSuggestions(suggestions);
        } catch (error) {
          console.error('Error during accessibility scan:', error);
        } finally {
          setIsScanning(false);
        }
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [content]);

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      onContentChange?.(value);
    }
  };

  const handleFixApply = async (suggestion: FixSuggestion) => {
    try {
      const fixedContent = await fixSuggestionService.applyFix(suggestion, content);
      setContent(fixedContent);
      onContentChange?.(fixedContent);
    } catch (error) {
      console.error('Error applying fix:', error);
    }
  };

  const reportData: ReportData = {
    timestamp: new Date().toISOString(),
    violations,
    compliance: {
      score: complianceResults?.score || 0,
      level: complianceResults?.level || 'Unknown',
      details: complianceResults?.details || {},
    },
    fixSuggestions,
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2 }}>
        <Typography variant="h6">Accessibility Editor</Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Editor">
          <IconButton
            onClick={() => setActiveTab('editor')}
            color={activeTab === 'editor' ? 'primary' : 'default'}
          >
            <CodeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Preview">
          <IconButton
            onClick={() => setActiveTab('preview')}
            color={activeTab === 'preview' ? 'primary' : 'default'}
          >
            <PreviewIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Accessibility Issues">
          <IconButton
            color={violations.length > 0 ? 'error' : 'default'}
          >
            <IssuesIcon />
            {violations.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bgcolor: 'error.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                }}
              >
                {violations.length}
              </Box>
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'editor' ? (
              <MonacoEditor
                height="100%"
                defaultLanguage="html"
                value={content}
                onChange={handleContentChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  theme: 'vs-dark',
                }}
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  p: 2,
                  overflow: 'auto',
                  '& iframe': {
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  },
                }}
              >
                <iframe
                  ref={previewRef}
                  srcDoc={content}
                  title="Preview"
                />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} sx={{ height: '100%', overflow: 'auto' }}>
          <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SimulationControls content={content} />
            
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Accessibility Issues
              </Typography>
              {isScanning ? (
                <Typography>Scanning...</Typography>
              ) : violations.length > 0 ? (
                <FixSuggestions
                  violations={violations}
                  documentContent={content}
                  onApplyFix={handleFixApply}
                />
              ) : (
                <Typography color="success.main">
                  No accessibility issues found!
                </Typography>
              )}
            </Paper>

            {complianceResults && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  WCAG Compliance
                </Typography>
                <Typography>
                  Score: {complianceResults.score}%
                </Typography>
                <Typography>
                  Level: {complianceResults.level}
                </Typography>
              </Paper>
            )}

            <ExportControls
              reportData={reportData}
              previewElement={previewRef.current?.contentDocument?.body}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Editor; 