"use client"
// Legacy Firebase Auth context — identity now uses Phoenix sessions.
// Kept as a no-op provider so old imports do not break; prefer `@/lib/auth`.
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext({ user: null });

export function AuthProvider({ children }) {
  const [user] = useState(null);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useFirebaseAuth = () => useContext(AuthContext);
