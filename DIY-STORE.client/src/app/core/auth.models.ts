export interface UserInfo {
  id: string;
  username: string;
  email: string;
  address: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserInfo;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  address: string;
  password: string;
}
