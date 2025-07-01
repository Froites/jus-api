export interface User {
  id: number;
  nome: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreate {
  nome: string;
  email: string;
  senha: string;
}

export interface UserLogin {
  email: string;
  senha: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}