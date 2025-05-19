export interface Project {
  ID: string;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  title: string;
  name: string;
  description: string;
  url: string;
  user_id: string;
  last_scan: string;
  score: number;
  status: 'active' | 'archived';
}

export interface CreateProjectInput {
  title: string;
  name: string;
  description?: string;
  url?: string;
}

export interface UpdateProjectInput extends CreateProjectInput {
  status?: 'active' | 'archived';
} 