import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Preview as PreviewIcon,
  Engineering as EngineeringIcon,
  Speed as SpeedIcon,
  AutoFixHigh as AutoFixIcon,
} from '@mui/icons-material';
import { ComplianceViolation } from '../services/complianceService';
import { FixSuggestion, fixSuggestionService } from '../services/fixSuggestionService';
import CodeDiff from './CodeDiff';

interface FixSuggestionsProps {
  violations: ComplianceViolation[];
  documentContent: string;
  onApplyFix: (fixedContent: string) => void;
}

const getImpactColor = (impact: FixSuggestion['impact']) => {
  switch (impact) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

const getEffortColor = (effort: FixSuggestion['effort']) => {
  switch (effort) {
    case 'easy':
      return 'success';
    case 'medium':
      return 'warning';
    case 'complex':
      return 'error';
    default:
      return 'default';
  }
};

const FixSuggestionsView: React.FC<FixSuggestionsProps> = ({
  violations,
  documentContent,
  onApplyFix,
}) => {
  const [suggestions] = useState<FixSuggestion[]>(() =>
    fixSuggestionService.generateSuggestions(violations)
  );
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<FixSuggestion | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');

  const handlePreview = async (suggestion: FixSuggestion) => {
    try {
      const preview = await fixSuggestionService.previewFix(suggestion, documentContent);
      setPreviewContent(preview);
      setSelectedSuggestion(suggestion);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Failed to preview fix:', error);
    }
  };

  const handleApplyFix = async (suggestion: FixSuggestion) => {
    try {
      const fixedContent = await fixSuggestionService.applyFix(suggestion, documentContent);
      onApplyFix(fixedContent);
    } catch (error) {
      console.error('Failed to apply fix:', error);
    }
  };

  const automatedSuggestions = suggestions.filter((s) => s.automated);
  const manualSuggestions = suggestions.filter((s) => !s.automated);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Fix Suggestions ({suggestions.length})
      </Typography>

      {automatedSuggestions.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <AutoFixIcon color="primary" />
              <Typography variant="h6">
                Automated Fixes ({automatedSuggestions.length})
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={() =>
                  automatedSuggestions.reduce(
                    (promise, suggestion) =>
                      promise.then(() => handleApplyFix(suggestion)),
                    Promise.resolve()
                  )
                }
              >
                Apply All Automated Fixes
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {suggestions.map((suggestion) => (
          <Grid item xs={12} key={suggestion.id}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  {suggestion.automated ? (
                    <AutoFixIcon color="primary" />
                  ) : (
                    <EngineeringIcon color="action" />
                  )}
                  <Box flex={1}>
                    <Typography variant="subtitle1">
                      {suggestion.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {suggestion.violationId}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Impact">
                      <Chip
                        icon={<SpeedIcon />}
                        label={suggestion.impact}
                        size="small"
                        color={getImpactColor(suggestion.impact)}
                      />
                    </Tooltip>
                    <Tooltip title="Effort">
                      <Chip
                        icon={<EngineeringIcon />}
                        label={suggestion.effort}
                        size="small"
                        color={getEffortColor(suggestion.effort)}
                      />
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Code Changes:
                  </Typography>
                  <CodeDiff
                    oldCode={suggestion.before}
                    newCode={suggestion.after}
                  />
                  <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                    <Button
                      startIcon={<PreviewIcon />}
                      onClick={() => handlePreview(suggestion)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleApplyFix(suggestion)}
                    >
                      Apply Fix
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Preview Fix: {selectedSuggestion?.description}
        </DialogTitle>
        <DialogContent>
          <CodeDiff
            oldCode={documentContent}
            newCode={previewContent}
            context={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Close
          </Button>
          {selectedSuggestion && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleApplyFix(selectedSuggestion);
                setPreviewDialogOpen(false);
              }}
            >
              Apply Fix
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FixSuggestionsView; 