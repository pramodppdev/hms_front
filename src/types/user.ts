export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient' | 'registration' | 'department';
  department_id?: string;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface CreateUserDTO {
  email: string;
  password: string;
  username: string;
  role: User['role'];
  department_id?: string;
}

export interface UpdateUserDTO {
  username?: string;
  role?: User['role'];
  department_id?: string;
  email?: string;
}

export interface UpdateUserPasswordDTO {
  password: string;
}