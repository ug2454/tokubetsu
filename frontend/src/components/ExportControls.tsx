import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  PictureAsPdf as PDFIcon,
  Code as JSONIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { exportService, ReportData } from '../services/exportService';

interface ExportControlsProps {
  reportData: ReportData;
  previewElement?: HTMLElement;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  reportData,
  previewElement,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleExportPDF = async () => {
    try {
      const pdfBlob = await exportService.generatePDFReport(reportData, previewElement);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accessibility-report-${new Date().toISOString()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotification({
        open: true,
        message: 'PDF report downloaded successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setNotification({
        open: true,
        message: 'Failed to generate PDF report',
        severity: 'error',
      });
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonData = exportService.generateJSONReport(reportData);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accessibility-report-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotification({
        open: true,
        message: 'JSON report downloaded successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error generating JSON:', error);
      setNotification({
        open: true,
        message: 'Failed to generate JSON report',
        severity: 'error',
      });
    }
  };

  const handleShare = async () => {
    try {
      const url = await exportService.generateShareableLink(reportData);
      setShareUrl(url);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error generating shareable link:', error);
      setNotification({
        open: true,
        message: 'Failed to generate shareable link',
        severity: 'error',
      });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setNotification({
      open: true,
      message: 'URL copied to clipboard',
      severity: 'success',
    });
    setDialogOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
      <Button
        variant="contained"
        startIcon={<PDFIcon />}
        onClick={handleExportPDF}
      >
        Export PDF
      </Button>
      <Button
        variant="contained"
        startIcon={<JSONIcon />}
        onClick={handleExportJSON}
      >
        Export JSON
      </Button>
      <Button
        variant="contained"
        startIcon={<ShareIcon />}
        onClick={handleShare}
      >
        Share Report
      </Button>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Share Report</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Copy the link below to share this report:
          </Typography>
          <TextField
            fullWidth
            value={shareUrl}
            InputProps={{
              readOnly: true,
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCopyUrl} variant="contained">
            Copy URL
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExportControls; 