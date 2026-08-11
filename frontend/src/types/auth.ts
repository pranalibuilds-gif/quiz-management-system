export type UserRole = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}
