
import { toast } from "@/hooks/use-toast";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { authService } from "../services/api";
import { User } from "../types";

export const AuthContext = createContext<{
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}>({
  currentUser: null,
  login: async () => { throw new Error("Not implemented"); },
  logout: () => { },
  register: async () => { throw new Error("Not implemented"); },
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const localUser = authService.getCurrentUser();
        if (localUser) {
          setCurrentUser(localUser);
        }

        const { data } = await authService.getProfile();
        if (data) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
        // Clear invalid session
        authService.logout();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await authService.login(email, password);

      if (!response || !response.token || !response.user) {
        throw new Error("Invalid response from server. Missing token or user data.");
      }

      localStorage.setItem("auth-token", response.token);
      setCurrentUser(response.user);

      if (response.message) {
        toast({
          title: "Success",
          description: response.message,
        });
      }

      return response.user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Invalid email or password";

      // Show toast for API errors
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });

      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    try {
      const response = await authService.register(userData);

      if (!response.data?.user) {
        throw new Error("User Creation failed. Invalid response from server.");
      }

      toast({
        title: "User Created Successfully",
        description: "account has been created successfully",
      });

      return response.data.user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
        (error.response?.status === 409 ? "Email already exists" :
          error.message || "Registration failed. Please try again.");

      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });

      throw new Error(errorMessage);
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === "admin",
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// Export the authService for direct use when needed
export { authService };

