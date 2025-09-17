import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utilisateurs de démonstration
const demoUsers: User[] = [
  {
    id: '1',
    email: 'admin@resto-congo.cg',
    name: 'Jean-Baptiste Loubaki',
    role: 'admin'
  },
  {
    id: '2',
    email: 'manager@resto-congo.cg',
    name: 'Antoinette Mvou',
    role: 'manager'
  }
];

const demoPasswords: Record<string, string> = {
  'admin@resto-congo.cg': 'admin123',
  'manager@resto-congo.cg': 'manager123'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulation d'une requête API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const foundUser = demoUsers.find(u => u.email === email);
    const isValidPassword = demoPasswords[email] === password;
    
    if (foundUser && isValidPassword) {
      setUser(foundUser);
      localStorage.setItem('admin_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}