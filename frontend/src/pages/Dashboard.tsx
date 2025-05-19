import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Tooltip,
  CardActions,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import { 
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon, 
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  BugReport as BugReportIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  History as HistoryIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types/project';
import { projectService } from '../services/projectService';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, BarChart, Bar } from 'recharts';
import { format, parseISO, isValid, subDays } from 'date-fns';
import { ActivityLogItem } from '../types/activity';
import { getActivityLog, getScans } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';
import { ScanDashboardItem } from '../types/scan';
import { ComplianceReportItem } from '../types/compliance';
import { complianceService } from '../services/complianceService';
import { ScanResults } from '../components/ScanResults';
import { scannerService, ScanResult } from '../services/scannerService';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedScans: number;
  issuesDetected: number;
}

// REMOVED: Old ScanResult interface definition
/*
interface ScanResult {
  id: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  score: number;
  issues: number;
  status: 'completed' | 'failed' | 'in_progress';
}
*/

const COLORS = ['#4caf50', '#f44336', '#ff9800', '#2196f3'];

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0, 
    completedScans: 0,
    issuesDetected: 0
  });
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [recentScans, setRecentScans] = useState<ScanDashboardItem[]>([]);
  const [scanningProject, setScanningProject] = useState<Project | null>(null);
  const [selectedProjectForReport, setSelectedProjectForReport] = useState<Project | null>(null);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [complianceReports, setComplianceReports] = useState<ComplianceReportItem[]>([]);
  const [loadingComplianceReports, setLoadingComplianceReports] = useState(false);
  const [complianceReportsError, setComplianceReportsError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for the new scan results dialog
  const [currentScanResultForDialog, setCurrentScanResultForDialog] = useState<ScanResult | null>(null);
  const [isScanResultDialogOpen, setIsScanResultDialogOpen] = useState(false);
  const [scanDetailLoading, setScanDetailLoading] = useState(false);

  // REMOVED: generateMockScanData function
  /*
  const generateMockScanData = useCallback(() => {
    const mockScans: ScanResult[] = [];
    const statuses: ('completed' | 'failed' | 'in_progress')[] = ['completed', 'completed', 'failed', 'in_progress'];
    
    for (let i = 0; i < 3; i++) {
      mockScans.push({
        id: `scan-${i}`,
        projectId: `project-${i}`,
        projectName: `Project ${i + 1}`,
        timestamp: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
        score: Math.floor(Math.random() * 100),
        issues: Math.floor(Math.random() * 25),
        status: statuses[i % statuses.length]
      });
    }
    return mockScans;
  }, []);
  */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const projectsData = await projectService.getProjects();
      setProjects(projectsData.slice(0, 5));
      
      const activityData = await getActivityLog({ limit: 7 });
      setActivityLog(activityData || []);

      const scansData: ScanDashboardItem[] = await getScans({ limit: 3 }) || [];
      setRecentScans(scansData);
      
      const completedScansCount = scansData.filter((scan: ScanDashboardItem) => scan.status === 'completed').length;
      const issuesDetectedCount = scansData.reduce((sum: number, scan: ScanDashboardItem) => sum + (scan.issues_count || 0), 0);

      setStats({
        totalProjects: projectsData.length,
        activeProjects: projectsData.filter((p: Project) => p.status === 'active').length,
        completedScans: completedScansCount,
        issuesDetected: issuesDetectedCount,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setActivityLog([]);
      setRecentScans([]); // Ensure scans are also cleared on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const projectsData = await projectService.getProjects();
      setProjects(projectsData.slice(0, 5));
      
      const activityData = await getActivityLog({ limit: 7 });
      setActivityLog(activityData || []);

      const scansData: ScanDashboardItem[] = await getScans({ limit: 3 }) || [];
      setRecentScans(scansData);
      
      const completedScansCount = scansData.filter((scan: ScanDashboardItem) => scan.status === 'completed').length;
      const issuesDetectedCount = scansData.reduce((sum: number, scan: ScanDashboardItem) => sum + (scan.issues_count || 0), 0);

      setStats({
        totalProjects: projectsData.length,
        activeProjects: projectsData.filter((p: Project) => p.status === 'active').length,
        completedScans: completedScansCount,
        issuesDetected: issuesDetectedCount,
      });

    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      setActivityLog([]);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const projectStatusData = [
    { name: 'Active', value: stats.activeProjects },
    { name: 'Inactive', value: stats.totalProjects - stats.activeProjects },
  ];

  const scanHistoryData = [
    { date: '6 days ago', scans: 3, issues: 7 },
    { date: '5 days ago', scans: 5, issues: 12 },
    { date: '4 days ago', scans: 2, issues: 5 },
    { date: '3 days ago', scans: 8, issues: 18 },
    { date: '2 days ago', scans: 4, issues: 10 },
    { date: 'Yesterday', scans: 6, issues: 14 },
    { date: 'Today', scans: stats.completedScans, issues: stats.issuesDetected },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan':
        return <SearchIcon color="primary" />;
      case 'project':
        return <CheckCircleOutlineIcon color="success" />;
      case 'issue':
        return <BugReportIcon color="error" />;
      case 'compliance':
        return <AssessmentIcon color="info" />;
      default:
        return <HistoryIcon />;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-project':
        navigate('/projects');
        break;
      case 'run-scan':
        if (projects.length > 0) {
          // For quick action, perhaps scan the first project or open a selection dialog
          // For now, let's try to scan the first project in the list
          handleRunScan(projects[0], new MouseEvent('click') as any); // Cast to any for synthetic event
        } else {
          // Handle case where there are no projects, e.g., show a message or navigate to create project
          navigate('/projects');
        }
        break;
      case 'view-reports':
        // This is generic, maybe navigate to a general reports page or open a project selection for reports
        // For now, let's assume it means viewing reports for the first project if available
        if (projects.length > 0) {
          setSelectedProjectForReport(projects[0]);
        } else {
           navigate('/projects'); // Or show a message
        }
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMM d, yyyy h:mm a');
      }
      return 'Invalid date';
    } catch (error) {
      return 'Invalid date format';
    }
  };

  const handleRunScan = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setScanningProject(project); // Shows "Running Scan..." dialog or indicator
    setScanDetailLoading(false); // Reset detail loading state
    setCurrentScanResultForDialog(null); // Clear previous results
    setIsScanResultDialogOpen(false); // Close any open dialog

    try {
      console.log(`Initiating backend scan for project ID: ${project.ID}, Name: ${project.name} (Dashboard)`);
      await projectService.runScan(project.ID); // Trigger backend scan
      console.log('Backend scan initiated successfully for project:', project.name);

      // Now, perform an on-the-fly scan to get immediate detailed results for the dialog
      setScanningProject(null); // Close the initial "Running Scan..." dialog
      
      // Open the dialog immediately and show loading state inside ScanResults
      setIsScanResultDialogOpen(true); 
      setScanDetailLoading(true); 

      console.log(`Fetching live scan details for URL: ${project.url} for project: ${project.name}`);
      const detailedScanResults = await scannerService.scanUrl(project.url);
      console.log('Live scan details fetched for dashboard dialog:', detailedScanResults);
      
      setCurrentScanResultForDialog(detailedScanResults);
      setScanDetailLoading(false); // Stop loading, ScanResults will update

    } catch (error) {
      console.error(`Error during scan process for project ${project.name}:`, error);
      // It's good to have a user-facing error message here
      alert(`Failed to complete scan for ${project.name}. Please try again or check the project URL.`);
      setIsScanResultDialogOpen(false); 
      setCurrentScanResultForDialog(null);
    } finally {
      // Ensure all loading states are reset
      if (scanningProject) setScanningProject(null); 
      if (scanDetailLoading) setScanDetailLoading(false);
    }
  };

  const handleViewDetails = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Navigating to project details. Project ID:', project.ID, 'Project object:', project);
    navigate(`/projects/${project.ID}`);
  };

  const handleViewReport = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProjectForReport(project);
  };

  const handlePreviewProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewProject(project);
  };

  const handleCloseScanDialog = () => {
    setScanningProject(null);
  };

  const handleCloseReportDialog = () => {
    setSelectedProjectForReport(null);
    // Clear reports and error when dialog is closed
    setComplianceReports([]);
    setComplianceReportsError(null);
  };

  const handleClosePreviewDialog = () => {
    setPreviewProject(null);
  };

  const handleCloseScanResultDialog = () => {
    setIsScanResultDialogOpen(false);
    setCurrentScanResultForDialog(null);
  };

  useEffect(() => {
    if (selectedProjectForReport) {
      const fetchReports = async () => {
        setLoadingComplianceReports(true);
        setComplianceReportsError(null);
        setComplianceReports([]);
        try {
          console.log(`Fetching compliance reports for project: ${selectedProjectForReport.ID}`);
          const reports = await complianceService.getProjectComplianceReports(selectedProjectForReport.ID);
          setComplianceReports(reports || []);
        } catch (err: any) {
          console.error('Error fetching compliance reports:', err);
          setComplianceReportsError(err.response?.data?.error || err.message || 'Failed to fetch reports.');
        }
        setLoadingComplianceReports(false);
      };
      fetchReports();
    }
  }, [selectedProjectForReport]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshData}
        >
          Refresh
        </Button>
      </Box>
      
      <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'white' }}>
        <Typography variant="h5">Welcome back, {user?.name || 'User'}</Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Here's an overview of your project status and recent activity
        </Typography>
      </Paper>

      <Typography variant="h5" sx={{ mb: 2 }}>Overview</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Projects
              </Typography>
              <Typography variant="h3">{stats.totalProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Projects
              </Typography>
              <Typography variant="h3" color="success.main">{stats.activeProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Scans
              </Typography>
              <Typography variant="h3" color="info.main">{stats.completedScans}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Issues Detected
              </Typography>
              <Typography variant="h3" color="warning.main">{stats.issuesDetected}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Button 
            fullWidth 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleQuickAction('new-project')}
            sx={{ p: 2 }}
          >
            Create New Project
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button 
            fullWidth 
            variant="contained" 
            color="secondary"
            startIcon={<SearchIcon />}
            onClick={() => handleQuickAction('run-scan')}
            disabled={projects.length === 0}
            sx={{ p: 2 }}
          >
            Run New Scan
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button 
            fullWidth 
            variant="contained" 
            color="info"
            startIcon={<AssessmentIcon />}
            onClick={() => handleQuickAction('view-reports')}
            sx={{ p: 2 }}
          >
            View Reports
          </Button>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mb: 2 }}>Analytics</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Project Status" />
            <CardContent>
              <Box height={220} display="flex" alignItems="center" justifyContent="center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Scan History" />
            <CardContent>
              <Box height={220}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={scanHistoryData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="scans" stroke="#8884d8" name="Scans" />
                    <Line type="monotone" dataKey="issues" stroke="#82ca9d" name="Issues" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">Recent Projects</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects')}
            >
              View All Projects
            </Button>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} key={project.ID}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/projects/${project.ID}`)}
                >
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {project.title}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {project.url}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {project.status === 'active' ? 
                        <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 0.5 }} /> : 
                        <WarningIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                      }
                      <Typography
                        variant="body2"
                        color={project.status === 'active' ? 'success.main' : 'warning.main'}
                      >
                        Status: {project.status}
                      </Typography>
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Created: {new Date(project.CreatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Tooltip title="Run Scan">
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleRunScan(project, e)}
                      >
                        <SearchIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleViewDetails(project, e)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Compliance Report">
                      <IconButton 
                        size="small"
                        onClick={(e) => handleViewReport(project, e)}
                      >
                        <AssessmentIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {projects.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No projects found. Create your first project to get started!
                </Alert>
              </Grid>
            )}
          </Grid>

          <Typography variant="h5" sx={{ mb: 2 }}>Recent Scan Results</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {recentScans.map((scan: ScanDashboardItem) => (
              <Grid item xs={12} key={scan.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{scan.project_name}</Typography>
                        <Typography variant="caption" display="block">
                          Scanned: {formatDate(scan.timestamp)}
                        </Typography>
                      </Box>
                      <Box>
                        {scan.status === 'completed' && (
                          <Box display="flex" alignItems="center">
                            <Typography variant="body1" sx={{ mr: 2 }}>
                              Score: <span style={{ fontWeight: 'bold' }}>{scan.score !== undefined ? `${scan.score.toFixed(0)}%` : 'N/A'}</span>
                            </Typography>
                            <Typography variant="body1" color="warning.main">
                              Issues: <span style={{ fontWeight: 'bold' }}>{scan.issues_count}</span>
                            </Typography>
                          </Box>
                        )}
                        {scan.status === 'failed' && (
                          <Typography variant="body1" color="error">
                            Scan Failed
                          </Typography>
                        )}
                        {(scan.status === 'in_progress' || scan.status === 'pending') && (
                          <Box display="flex" alignItems="center">
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            <Typography variant="body1">{scan.status === 'in_progress' ? 'In Progress' : 'Pending'}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      disabled={scan.status === 'in_progress' || scan.status === 'pending' || scan.status === 'failed'}
                      onClick={() => navigate(`/projects/${scan.project_id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<RefreshIcon />}
                      disabled={scan.status === 'in_progress'}
                      onClick={() => navigate(`/projects/${scan.project_id}`)} // Consider making this trigger a new scan for this specific project scan entry
                    >
                      Run Again
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
            {recentScans.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No scan results found. Run a scan to see results here.
                </Alert>
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 4, height: '100%' }}>
            <CardHeader 
              title="Activity Timeline" 
              action={
                <IconButton onClick={refreshData}>
                  <RefreshIcon />
                </IconButton>
              }
            />
            <CardContent>
              <List>
                {activityLog.map((log) => (
                  <ListItem
                    key={log.id}
                    sx={{ 
                      borderLeft: '2px solid', 
                      borderLeftColor: log.type === 'issue' ? 'error.main' : 
                                      log.type === 'scan' ? 'info.main' : 
                                      log.type === 'compliance' ? 'warning.main' : 'success.main',
                      pl: 2,
                      mb: 2,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' } 
                    }}
                  >
                    <ListItemIcon>
                      {getActivityIcon(log.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={log.action}
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.secondary">
                            {log.details ? `${log.details} - ` : ''}
                            {log.project_id && (
                              <Link component={RouterLink} to={`/projects/${log.project_id}`} sx={{ mr: 0.5 }}>
                                {log.project_name || 'Project'}
                              </Link>
                            )}
                            {formatDate(log.timestamp)}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                ))}
                {activityLog.length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No recent activity to show.
                  </Alert>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={!!scanningProject} onClose={handleCloseScanDialog}>
        <DialogTitle>
          Running Scan
          <IconButton
            aria-label="close"
            onClick={handleCloseScanDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {scanningProject && (
            <Box display="flex" flexDirection="column" alignItems="center" p={3}>
              <Typography variant="h6" gutterBottom>
                Scanning {scanningProject.title}
              </Typography>
              <CircularProgress sx={{ my: 3 }} />
              <Typography color="text.secondary">
                Please wait while we analyze your website for accessibility issues...
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!selectedProjectForReport} 
        onClose={handleCloseReportDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Compliance Reports
          <IconButton
            aria-label="close"
            onClick={handleCloseReportDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedProjectForReport && (
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Compliance Reports for: {selectedProjectForReport.title}
              </Typography>
              {loadingComplianceReports && <CircularProgress sx={{ my: 2, display: 'block', margin: 'auto' }} />}
              {complianceReportsError && <Alert severity="error" sx={{ my: 2 }}>{complianceReportsError}</Alert>}
              {!loadingComplianceReports && !complianceReportsError && complianceReports.length === 0 && (
                <Alert severity="info" sx={{ my: 2 }}>No compliance reports found for this project.</Alert>
              )}
              {!loadingComplianceReports && !complianceReportsError && complianceReports.length > 0 && (
                <List dense>
                  {complianceReports.map((report) => (
                    <ListItem key={report.ID} divider>
                      <ListItemIcon sx={{minWidth: 'auto', mr: 1.5}}>
                        <AssessmentIcon color="info" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Score: ${report.overall_score.toFixed(0)}% (URL: ${report.url})`}
                        secondary={`Generated: ${formatDate(report.generated_at)} - ID: ${report.ID.substring(0,8)}...`}
                      />
                      {/* TODO: Button to view full report, navigate to /compliance/:reportId */}
                       <Button 
                         size="small" 
                         onClick={() => navigate(`/compliance/${report.ID}`)} /* Placeholder navigation */
                       >
                         View
                       </Button>
                    </ListItem>
                  ))}
                </List>
              )}
              {/* Placeholder for a button to generate a new report */}
              {/* <Button variant="contained" sx={{mt: 2}} onClick={handleGenerateNewReport}>Generate New Report</Button> */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Close</Button>
          {/* <Button variant="contained" color="primary" disabled={complianceReports.length === 0}>
            Download Latest Report
          </Button> */}
        </DialogActions>
      </Dialog>

      <Dialog 
        open={!!previewProject} 
        onClose={handleClosePreviewDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Website Preview
          <IconButton
            aria-label="close"
            onClick={handleClosePreviewDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewProject && previewProject.url && (
            <Box height="70vh" border="1px solid #ddd">
              <iframe 
                src={previewProject.url}
                title={`Preview of ${previewProject.title}`}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                onError={() => {
                  console.error("Failed to load preview");
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for displaying detailed scan results from on-the-fly scan */}
      <Dialog
        open={isScanResultDialogOpen}
        onClose={handleCloseScanResultDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Scan Results for: {currentScanResultForDialog?.url || scanningProject?.url || 'Loading...'}
          <IconButton
            aria-label="close"
            onClick={handleCloseScanResultDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: currentScanResultForDialog ? 0 : 2 }}> {/* Remove padding if ScanResults handles it, else add for loading */}
          <ScanResults
            scanResult={currentScanResultForDialog}
            loading={scanDetailLoading} // This prop controls loading within ScanResults
            onClose={handleCloseScanResultDialog} // ScanResults component itself might not need this if dialog handles close
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScanResultDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 