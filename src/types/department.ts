export interface Department {
  id: string;
  name: string;
  description?: string;
  code?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  code?: string;
}

export interface UpdateDepartmentDTO {
  name?: string;
  description?: string;
  code?: string;
}