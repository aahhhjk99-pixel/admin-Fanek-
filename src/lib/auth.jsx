import { createContext, useContext } from 'react';

export const AuthContext = createContext({
  profile: null,
  permissions: null,
  can: () => false,
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);
