import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { ScanResult, Violation } from '../services/scannerService';

interface ScanResultsProps {
  scanResult: ScanResult | null;
  loading?: boolean;
  onClose?: () => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({ scanResult, loading = false, onClose }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!scanResult) {
    return null;
}

  const getImpactColor = (impact: string) => {
  switch (impact) {
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

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Scan Results
        </Typography>
        {onClose && (
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        )}
      </Box>

      <Box mb={3}>
        <Typography variant="body1" gutterBottom>
          URL: {scanResult.url}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Scanned at: {new Date(scanResult.timestamp).toLocaleString()}
        </Typography>
      </Box>

      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Typography variant="body1">
          Score: {scanResult.score}%
        </Typography>
        <Typography variant="body1">
          Passes: {scanResult.passes}
        </Typography>
        <Typography variant="body1">
          Violations: {scanResult.violations?.length || 0}
        </Typography>
      </Box>

      <Typography variant="h6" gutterBottom>
        Violations
      </Typography>
      {scanResult.violations && scanResult.violations.length > 0 ? (
        <List>
          {scanResult.violations.map((violation: Violation) => (
            <ListItem key={violation.id} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1">{violation.description}</Typography>
              <Chip
                      label={violation.impact}
                size="small"
                      color={getImpactColor(violation.impact) as any}
              />
            </Box>
                }
                secondary={
                  <Box component="span">
                    <Typography variant="body2" component="span" gutterBottom>
                {violation.help}
              </Typography>
                    <Box sx={{ mt: 1, mb: 1, bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                      <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                        Affected elements:
                        {violation.nodes.map((node, index) => (
                          <Box key={index} sx={{ pl: 2, color: 'error.main' }}>
                            {node}
                          </Box>
                        ))}
                      </Typography>
                    </Box>
                    <Button
                href={violation.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                      size="small"
                      sx={{ mt: 1 }}
              >
                      Learn More
                    </Button>
                  </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
      ) : (
        <Typography color="textSecondary">
          No violations found.
        </Typography>
      )}
    </Paper>
  );
}; 