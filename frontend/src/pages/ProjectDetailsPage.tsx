import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Alert, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Project } from '../types/project';
import { projectService } from '../services/projectService';

// TODO: Fetch actual project details using the projectId
// For now, this is a placeholder.

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = React.useState<Project | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) {
        setError('Project ID not found in URL.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching details for project ID: ${projectId}`);
        const data = await projectService.getProject(projectId);
        setProject(data);
      } catch (err: any) {
        console.error('Error fetching project details:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch project details.');
      }
      setLoading(false);
    };

    fetchProjectDetails();
  }, [projectId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  if (!project) {
    return <Alert severity="warning" sx={{ m: 3 }}>Project data could not be loaded.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {project.title}
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          ID: {project.ID}
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Name:</strong> {project.name}
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Description:</strong> {project.description}
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>URL:</strong> <a href={project.url} target="_blank" rel="noopener noreferrer">{project.url || 'N/A'}</a>
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Status:</strong> {project.status || 'N/A'}
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Created At:</strong> {project.CreatedAt ? new Date(project.CreatedAt).toLocaleString() : 'N/A'}
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Last Scan:</strong> {project.last_scan ? new Date(project.last_scan).toLocaleString() : 'N/A'}
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>Overall Score:</strong> {project.score !== undefined ? `${project.score}%` : 'N/A'}
        </Typography>
        <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>Further Details (Coming Soon)</Typography>
        <Typography variant="body2" color="text.secondary">
          This section will include scan history, issue lists, configuration settings, etc.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProjectDetailsPage; 