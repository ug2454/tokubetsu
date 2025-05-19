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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { projectService } from '../services/projectService';
import { scannerService, ScanResult } from '../services/scannerService';
import { ScanResults } from '../components/ScanResults';
import { Project, CreateProjectInput } from '../types/project';
import { SimulationControls } from '../components/SimulationControls';
import { SimulationPreview } from '../components/SimulationPreview';
import { complianceService, ComplianceReport } from '../services/complianceService';
import { ComplianceReport as ComplianceReportComponent } from '../components/ComplianceReport';

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
  const [scanningProject, setScanningProject] = useState<Project | null>(null);
  const [simulationIframe, setSimulationIframe] = useState<HTMLIFrameElement | null>(null);
  const [simulatingProject, setSimulatingProject] = useState<Project | null>(null);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [checkingCompliance, setCheckingCompliance] = useState<Project | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    console.log('Projects component mounted');
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    console.log('=== Fetching Projects ===');
    try {
      setLoading(true);
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
      setLoading(false);
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
    }
  };

  const handleDelete = async (ID: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.deleteProject(ID);
        fetchProjects();
      } catch (err) {
        setError('Failed to delete project');
        console.error(err);
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

      setScanningProject(project);
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
      setScanningProject(null);
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
      setCheckingCompliance(project);
      const report = await complianceService.generateReport(project.ID);
      setComplianceReport(report);
    } catch (err) {
      console.error('Failed to generate compliance report:', err);
      setError('Failed to generate compliance report');
    } finally {
      setCheckingCompliance(null);
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
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Project
        </Button>
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
                <IconButton
                  size="small"
                  onClick={() => handleOpenDialog(project)}
                  aria-label="edit"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(project.ID)}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleRunScan(project.ID)}
                  aria-label="scan"
                >
                  <RefreshIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleStartSimulation(project)}
                  aria-label="simulate"
                >
                  <VisibilityIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleCheckCompliance(project)}
                  aria-label="check compliance"
                >
                  <AssessmentIcon />
                </IconButton>
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editingProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {scanResult && (
        <Dialog
          open={!!scanResult}
          onClose={() => setScanResult(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent>
            <ScanResults
              scanResult={scanResult}
              onClose={() => setScanResult(null)}
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
    </Container>
  );
};

export default Projects; 