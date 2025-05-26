import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  CloudDownload as CloudDownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { projectService } from '../services/projectService';
import { scannerService, ScanResult } from '../services/scannerService';
import { ScanResults } from '../components/ScanResults';
import { Project, CreateProjectInput } from '../types/project';
import { SimulationControls } from '../components/SimulationControls';
import { SimulationPreview } from '../components/SimulationPreview';
import { complianceService, ComplianceReport } from '../services/complianceService';
import { ComplianceReport as ComplianceReportComponent } from '../components/ComplianceReport';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SUGGESTED_TEST_URLS = [
  {
    url: window.location.origin + '/test-page.html',
    description: 'Local test page with various accessibility features and issues'
  },
  {
    url: window.location.origin + '/test-page.html#form-section',
    description: 'Form elements section of the test page'
  },
  {
    url: window.location.origin + '/test-page.html#contrast-section',
    description: 'Text contrast test section'
  },
  {
    url: window.location.origin + '/test-page.html#images-section',
    description: 'Image accessibility test section'
  }
];

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<CreateProjectInput>({
    title: '',
    name: '',
    description: '',
    url: '',
  });
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [simulationIframe, setSimulationIframe] = useState<HTMLIFrameElement | null>(null);
  const [simulatingProject, setSimulatingProject] = useState<Project | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // New loading states
  const [submittingForm, setSubmittingForm] = useState(false);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [runningScans, setRunningScans] = useState<Set<string>>(new Set());
  const [checkingComplianceIds, setCheckingComplianceIds] = useState<Set<string>>(new Set());

  // State for download dialog
  const [openDownloadDialog, setOpenDownloadDialog] = useState(false);
  const [projectForDownload, setProjectForDownload] = useState<Project | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    console.log('Projects component mounted');
    fetchProjects();
  }, []);

  const fetchProjects = async (isRefresh = false) => {
    console.log('=== Fetching Projects ===');
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('Making API call to get projects');
      const data = await projectService.getProjects();
      console.log('Projects fetched:', data);
      console.log('First project details:', data[0]);
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to fetch projects');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title,
        name: project.name,
        description: project.description,
        url: project.url,
      });
    } else {
      setEditingProject(null);
      setFormData({
        title: '',
        name: '',
        description: '',
        url: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData({
      title: '',
      name: '',
      description: '',
      url: '',
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmittingForm(true);
      setError(null);
      if (editingProject) {
        await projectService.updateProject(editingProject.ID, formData);
      } else {
        await projectService.createProject(formData);
      }
      handleCloseDialog();
      fetchProjects();
    } catch (err) {
      setError('Failed to save project');
      console.error(err);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDelete = async (ID: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        setDeletingProject(ID);
        setError(null);
        await projectService.deleteProject(ID);
        fetchProjects();
      } catch (err) {
        setError('Failed to delete project');
        console.error(err);
      } finally {
        setDeletingProject(null);
      }
    }
  };

  const handleRunScan = async (ID: string) => {
    try {
      console.log('=== Scan Request Debug ===');
      console.log('Input ID:', ID);
      console.log('Projects state:', projects);
      
      const project = projects.find(p => p.ID === ID);
      console.log('Found project:', project);
      
      if (!project) {
        console.error('Project not found with ID:', ID);
        return;
      }

      console.log('Project details:');
      console.log('- ID:', project.ID);
      console.log('- URL:', project.url);
      console.log('- Title:', project.title);

      // Add to running scans set
      setRunningScans(prev => new Set(prev).add(ID));
      setError(null);

      // First update the project scan status
      console.log('Running scan for project:', project.ID);
      await projectService.runScan(project.ID);
      
      // Then run the accessibility scan
      console.log('Running accessibility scan for URL:', project.url);
      const result = await scannerService.scanUrl(project.url);
      console.log('Scan completed with result:', result);
      
      setScanResult(result);
      
      // Refresh the projects list
      await fetchProjects();
    } catch (err) {
      console.error('Failed to run scan:', err);
      setError('Failed to run scan');
    } finally {
      // Remove from running scans set
      setRunningScans(prev => {
        const newSet = new Set(prev);
        newSet.delete(ID);
        return newSet;
      });
    }
  };

  const handleStartSimulation = (project: Project) => {
    try {
      // First check if the URL is valid
      const url = new URL(project.url);
      setSimulatingProject(project);
    } catch (error) {
      setError('Invalid URL format. Please update the project URL.');
    }
  };

  // Add error handling for simulation iframe errors
  const handleSimulationError = () => {
    setError(
      'Unable to preview this website due to security restrictions. ' +
      'You can try one of our suggested test URLs or open in a new tab.'
    );
    setShowSuggestions(true);
  };

  const handleSuggestedUrlClick = (url: string) => {
    if (simulatingProject) {
      // Update the project with the new URL
      setFormData({
        ...formData,
        url: url
      });
      // Show the edit dialog
      handleOpenDialog(simulatingProject);
      // Close the simulation dialog
      setSimulatingProject(null);
      setShowSuggestions(false);
      setError(null);
    }
  };

  const handleCheckCompliance = async (project: Project) => {
    try {
      // Add to checking compliance set
      setCheckingComplianceIds(prev => new Set(prev).add(project.ID));
      setError(null);
      const report = await complianceService.generateReport(project.ID);
      setComplianceReport(report);
    } catch (err) {
      console.error('Failed to generate compliance report:', err);
      setError('Failed to generate compliance report');
    } finally {
      // Remove from checking compliance set
      setCheckingComplianceIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(project.ID);
        return newSet;
      });
    }
  };

  const handleViewScanResults = async (project: Project) => {
    try {
      // Add to running scans set to show loading indicator (optional, or use a new state)
      setRunningScans(prev => new Set(prev).add(project.ID));
      const results = await scannerService.scanUrl(project.url);
      setScanResult(results);
    } catch (err) {
      console.error('Failed to run scan for viewing results:', err);
      setError('Failed to run scan: ' + (err instanceof Error ? err.message : String(err)));
      setScanResult(null); // Clear previous results on error
    } finally {
      setRunningScans(prev => {
        const next = new Set(prev);
        next.delete(project.ID);
        return next;
      });
    }
  };

  const handleOpenDownloadDialog = (project: Project) => {
    setProjectForDownload(project);
    setOpenDownloadDialog(true);
  };

  const handleCloseDownloadDialog = () => {
    setOpenDownloadDialog(false);
    setProjectForDownload(null);
  };

  const handleDownloadJson = async () => {
    if (!projectForDownload) return;
    setDownloading(true);
    setError(null);
    try {
      const results = await scannerService.scanUrl(projectForDownload.url);
      const jsonString = JSON.stringify(results, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${projectForDownload.name}_scan_results.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      handleCloseDownloadDialog();
    } catch (err) {
      console.error('Failed to download JSON:', err);
      setError('Failed to download JSON results: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!projectForDownload) return;
    setDownloading(true);
    setError(null);
    try {
      const results = await scannerService.scanUrl(projectForDownload.url);
      if (!results) {
        setError('No scan results available to generate PDF.');
        setDownloading(false);
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = margin;

      // Title
      doc.setFontSize(18);
      doc.text('Accessibility Scan Report', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Project Info
      doc.setFontSize(12);
      doc.text(`Project: ${projectForDownload.name}`, margin, yPos);
      yPos += 7;
      doc.text(`URL: ${results.url}`, margin, yPos);
      yPos += 7;
      doc.text(`Scan Date: ${new Date(results.timestamp).toLocaleString()}`, margin, yPos);
      yPos += 10;

      // Summary Table
      const summaryData = [
        ['Violations', results.violations.length.toString()],
        ['Passes', results.passes.toString()],
      ];
      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Count']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Violations Details
      if (results.violations.length > 0) {
        doc.setFontSize(14);
        doc.text('Violations Details', margin, yPos);
        yPos += 8;
        const violationData = results.violations.map(v => [
          v.id,
          v.impact,
          v.description,
          v.nodes.length.toString(),
        ]);
        autoTable(doc, {
          startY: yPos,
          head: [['Rule ID', 'Impact', 'Description', 'Nodes']],
          body: violationData,
          theme: 'striped',
          headStyles: { fillColor: [192, 57, 43] }, // Red for violations
          margin: { left: margin, right: margin },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
      
      doc.save(`${projectForDownload.name}_scan_report.pdf`);
      handleCloseDownloadDialog();

    } catch (err) {
       console.error('Failed to download PDF:', err);
       setError('Failed to download PDF results: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Projects
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh projects">
            <IconButton
              onClick={() => fetchProjects(true)}
              disabled={refreshing}
              color="primary"
            >
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.ID}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {project.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {project.name}
                </Typography>
                <Typography variant="body2" component="p">
                  {project.description}
                </Typography>
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Last Scan: {project.last_scan ? new Date(project.last_scan).toLocaleDateString() : 'Never'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Score: {project.score ? `${project.score}%` : 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Tooltip title="Edit project">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(project)}
                    aria-label="edit"
                    disabled={deletingProject === project.ID || runningScans.has(project.ID) || checkingComplianceIds.has(project.ID)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete project">
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(project.ID)}
                    aria-label="delete"
                    disabled={deletingProject === project.ID || runningScans.has(project.ID) || checkingComplianceIds.has(project.ID)}
                  >
                    {deletingProject === project.ID ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Run accessibility scan">
                  <IconButton
                    size="small"
                    onClick={() => handleRunScan(project.ID)}
                    aria-label="scan"
                    disabled={deletingProject === project.ID || runningScans.has(project.ID) || checkingComplianceIds.has(project.ID)}
                  >
                    {runningScans.has(project.ID) ? (
                      <CircularProgress size={20} />
                    ) : (
                      <RefreshIcon />
                    )}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Preview website">
                  <IconButton
                    size="small"
                    onClick={() => handleStartSimulation(project)}
                    aria-label="simulate"
                    disabled={deletingProject === project.ID || runningScans.has(project.ID) || checkingComplianceIds.has(project.ID)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Check WCAG compliance">
                  <IconButton 
                      size="small" 
                      onClick={() => handleCheckCompliance(project)}
                      aria-label="check compliance"
                      disabled={deletingProject === project.ID || runningScans.has(project.ID) || checkingComplianceIds.has(project.ID)}
                  >
                      {checkingComplianceIds.has(project.ID) ? (
                        <CircularProgress size={20} />
                      ) : (
                        <AssessmentIcon />
                      )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Scan Results">
                  <IconButton size="small" onClick={() => handleOpenDownloadDialog(project)}>
                    <CloudDownloadIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'New Project'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="URL"
            fullWidth
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submittingForm}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
            disabled={submittingForm}
            startIcon={submittingForm ? <CircularProgress size={16} /> : undefined}
          >
            {submittingForm ? 'Saving...' : (editingProject ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {scanResult && (
        <Dialog
          open={!!scanResult}
          onClose={() => setScanResult(null)}
          maxWidth="xl"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Scan Results for {scanResult?.url}
            <IconButton
              aria-label="close"
              onClick={() => setScanResult(null)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: scanResult ? 0 : 2 }}>
            <ScanResults 
              scanResult={scanResult} 
              loading={scanResult === null && projects.some(p => runningScans.has(p.ID))}
            />
          </DialogContent>
        </Dialog>
      )}

      {complianceReport && (
        <Dialog
          open={!!complianceReport}
          onClose={() => setComplianceReport(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent>
            <ComplianceReportComponent
              report={complianceReport}
            />
          </DialogContent>
        </Dialog>
      )}

      {simulatingProject && (
        <Dialog
          open={!!simulatingProject}
          onClose={() => {
            setSimulatingProject(null);
            setError(null);
            setShowSuggestions(false);
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Website Simulation
            {error && " - Preview Not Available"}
          </DialogTitle>
          <DialogContent>
            {error && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {error}
                </Alert>
                <Box sx={{ mt: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Suggested Test URLs
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    These test pages are hosted locally and are guaranteed to work with the simulation:
                  </Typography>
                  <Grid container spacing={2}>
                    {SUGGESTED_TEST_URLS.map((site) => (
                      <Grid item xs={12} key={site.url}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleSuggestedUrlClick(site.url)}
                          sx={{ 
                            justifyContent: 'flex-start', 
                            textAlign: 'left', 
                            py: 1,
                            px: 2,
                            height: 'auto'
                          }}
                        >
                          <Box>
                            <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
                              {site.url}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {site.description}
                            </Typography>
                          </Box>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </>
            )}
            <SimulationControls onClose={() => {
              setSimulatingProject(null);
              setError(null);
              setShowSuggestions(false);
            }} />
            <SimulationPreview
              url={simulatingProject.url}
              onLoad={setSimulationIframe}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Download Options Dialog */}
      <Dialog open={openDownloadDialog} onClose={handleCloseDownloadDialog}>
        <DialogTitle>Download Scan Results for {projectForDownload?.name}</DialogTitle>
        <DialogContent>
          <Typography>Choose a format to download:</Typography>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDownloadDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDownloadJson} 
            color="primary" 
            variant="contained"
            disabled={downloading}
            startIcon={downloading ? <CircularProgress size={20} /> : null}
          >
            Download JSON
          </Button>
          <Button 
            onClick={handleDownloadPdf} 
            color="secondary" 
            variant="contained"
            disabled={downloading}
            startIcon={downloading ? <CircularProgress size={20} /> : null}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Projects; 