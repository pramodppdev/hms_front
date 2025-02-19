export interface SignUpCredentials {
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'patient' | 'registration' | 'department';
  username: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    username: string;
  } | null;
  error: Error | null;
}