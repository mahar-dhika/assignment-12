"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // IMPROVED: memoized token verification with proper error handling
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // IMPROVED: Verify token with server instead of client-side decoding
          const response = await fetch("/api/verify-token", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({
              userId: userData.id,
              username: userData.username,
              email: userData.email,
              fullName: userData.fullName,
            });
          } else {
            // Token is invalid, remove it
            localStorage.removeItem("token");
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem("token", token);
    setUser({
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
    });
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setLoading(false);
    router.push("/login");
  };

  const requireAuth = (redirectTo = "/login") => {
    if (!loading && !user) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  const requireGuest = (redirectTo = "/users") => {
    if (!loading && user) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  return {
    user,
    loading,
    login,
    logout,
    requireAuth,
    requireGuest,
  };
}
