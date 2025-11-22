/**
 * Auth Types - Authentication Type Definitions
 */

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'farmer' | 'admin';
  emailVerified: boolean;
  profilePhotoUrl?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  token: string;
  user: User;
}

