import api from './api';
import { Project, CreateProjectInput, UpdateProjectInput } from '../types/project';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await api.get('/api/projects');
    return response.data;
  },

  async getProject(id: string): Promise<Project> {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const response = await api.post('/api/projects', input);
    return response.data;
  },

  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const response = await api.put(`/api/projects/${id}`, input);
    return response.data;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/api/projects/${id}`);
  },

  async runScan(id: string): Promise<{ score: number }> {
    console.log('=== Project Scan Request Details ===');
    console.log('Project ID:', id);
    console.log('Project ID type:', typeof id);
    console.log('Project ID length:', id.length);
    
    const response = await api.post(`/api/projects/${id}/scan`);
    console.log('Project scan response:', response.data);
    return response.data;
  },
}; 