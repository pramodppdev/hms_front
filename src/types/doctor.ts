export interface DoctorProfile {
  id: string;
  specialization: string;
  qualifications: string;
  schedule: Record<string, any>;
  contact_number: string;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    email: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateDoctorDTO {
  email: string;
  password: string;
  username: string;
  department_id: string;
  specialization: string;
  qualifications: string;
  contact_number: string;
}

export interface UpdateDoctorDTO {
  username?: string;
  specialization?: string;
  qualifications?: string;
  contact_number?: string;
  schedule?: Record<string, any>;
}