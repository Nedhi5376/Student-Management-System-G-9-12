import { createContext } from 'react';

// AuthContext: shared object that lets any component read the auth state and actions via useAuth().
export const AuthContext = createContext(null);
