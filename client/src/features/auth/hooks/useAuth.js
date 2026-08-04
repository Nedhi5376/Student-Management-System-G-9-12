import { useContext } from 'react';
import { AuthContext } from '../../../context/auth-context.js';

// useAuth: convenient hook that reads the auth context, failing fast if used outside the provider.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}
