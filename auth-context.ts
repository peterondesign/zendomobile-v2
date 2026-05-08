import { createContext, useContext } from 'react';

export type AuthenticatedUser = {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string | null;
};

export type AuthContextValue = {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  user: AuthenticatedUser | null;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isAuthenticating: false,
  user: null,
  onLogin: () => undefined,
  onSignup: () => undefined,
  onLogout: () => undefined,
});

export function useAuth() {
  return useContext(AuthContext);
}