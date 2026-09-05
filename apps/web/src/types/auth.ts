export interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  isVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;

  setAuth: (user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}
