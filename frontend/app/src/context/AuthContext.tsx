"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  user: { email: string; id: string } | null; // Assuming user data
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://todo-fullstack-backend-nhbofe139-ameen-khans-projects.vercel.app';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // On mount, try to load token from localStorage
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      // In a real app, you'd verify the token and fetch user data
      // For now, we'll decode a dummy user or fetch 'me' endpoint
      try {
        const decodedUser = decodeToken(storedToken); // Placeholder for decoding JWT
        setUser(decodedUser);
      } catch (err) {
        console.error("Failed to decode token:", err);
        logout(); // Clear invalid token
      }
    }
    setIsLoading(false);
  }, []);

  const decodeToken = (jwtToken: string) => {
    // This is a simplified client-side JWT decode.
    // In a real app, this should involve server-side validation.
    try {
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      return { id: payload.sub, email: payload.email || 'unknown@example.com' }; // 'sub' is standard for user ID
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  };


  const commonAuthLogic = async (
    endpoint: string,
    body: Record<string, string>,
    contentType: 'application/json' | 'application/x-www-form-urlencoded'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      let requestBody: BodyInit;
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      if (contentType === 'application/json') {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      } else { // form-urlencoded for login
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const formData = new URLSearchParams();
        for (const key in body) {
          formData.append(key, body[key]);
        }
        requestBody = formData;
      }

      const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const newToken = data.access_token;
      setToken(newToken);
      localStorage.setItem('access_token', newToken);

      const decodedUser = decodeToken(newToken);
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        throw new Error("Failed to decode user from token.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
      setToken(null);
      setUser(null);
      localStorage.removeItem('access_token');
      throw err; // Re-throw to allow component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    await commonAuthLogic('login', { username: email, password }, 'application/x-www-form-urlencoded');
  };

  const register = async (email: string, password: string) => {
    await commonAuthLogic('register', { email, password }, 'application/json');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    // Optionally, send a request to backend /api/logout if server-side invalidation is needed
    // For Phase II, it's client-side only.
    setError(null);
  };

  const value = {
    token,
    user,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
