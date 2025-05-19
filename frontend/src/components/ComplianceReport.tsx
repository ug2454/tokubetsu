import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Button,
  CircularProgress,
  Paper,
  useTheme,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface ComplianceViolation {
  ruleId: string;
  wcagLevel: string;
  criterion: string;
  impact: string;
  description: string;
  element: string;
  suggestion?: string;
}

interface ComplianceReportData {
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

interface ComplianceReportProps {
  report: ComplianceReportData;
}

const getImpactIcon = (impact: string) => {
  switch (impact) {
    case 'critical':
      return <ErrorIcon color="error" />;
    case 'serious':
      return <WarningIcon color="warning" />;
    case 'moderate':
      return <InfoIcon color="info" />;
    case 'minor':
      return <CheckCircleIcon color="success" />;
    default:
      return <InfoIcon />;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
};

const getImpactColor = (impact: string) => {
  switch (impact.toLowerCase()) {
    case 'critical':
      return 'error';
    case 'serious':
      return 'warning';
    case 'moderate':
      return 'info';
    case 'minor':
      return 'success';
    default:
      return 'default';
  }
};

const ScoreIndicator: React.FC<{ score: number; label: string }> = ({ score = 0, label }) => {
  const theme = useTheme();
  
  const getColor = (score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon color="success" />;
    if (score >= 70) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  // Ensure score is a number
  const safeScore = typeof score === 'number' ? score : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>{label}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getIcon(safeScore)}
          <Typography variant="h6" sx={{ color: getColor(safeScore) }}>
            {safeScore.toFixed(1)}%
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={safeScore}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            backgroundColor: getColor(safeScore),
          },
        }}
      />
    </Box>
  );
};

export const ComplianceReport: React.FC<ComplianceReportProps> = ({ report }) => {
  const theme = useTheme();

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'critical':
        return theme.palette.error.main;
      case 'serious':
        return theme.palette.warning.dark;
      case 'moderate':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Accessibility Compliance Report
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {new Date(report.generatedAt).toLocaleString()}
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom>
        URL: {report.url}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                WCAG Conformance Levels
              </Typography>
              <ScoreIndicator score={report.levelAScore} label="Level A" />
              <ScoreIndicator score={report.levelAAScore} label="Level AA" />
              <ScoreIndicator score={report.levelAAAScore} label="Level AAA" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                WCAG Principles
              </Typography>
              <ScoreIndicator score={report.perceivableScore} label="Perceivable" />
              <ScoreIndicator score={report.operableScore} label="Operable" />
              <ScoreIndicator score={report.understandableScore} label="Understandable" />
              <ScoreIndicator score={report.robustScore} label="Robust" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Violations ({report.violations.length})
        </Typography>
        <List>
          {report.violations.map((violation, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Divider />}
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1">
                        {violation.description}
                      </Typography>
                      <Chip
                        label={violation.wcagLevel}
                        size="small"
                        sx={{ backgroundColor: theme.palette.primary.light }}
                      />
                      <Chip
                        label={violation.impact}
                        size="small"
                        sx={{ backgroundColor: getImpactColor(violation.impact) }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        WCAG Criterion: {violation.criterion}
                      </Typography>
                      <Typography
                        component="pre"
                        sx={{
                          mt: 1,
                          p: 1,
                          backgroundColor: theme.palette.grey[100],
                          borderRadius: 1,
                          overflow: 'auto',
                        }}
                      >
                        {violation.element}
                      </Typography>
                      {violation.suggestion && (
                        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                          Suggestion: {violation.suggestion}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
}; 