"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const handleClickOutside = useCallback(() => {
    setShowDropdown(false);
  }, []);

  useEffect(() => {
    // Bad practice: checking token on every render
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Bad practice: decoding JWT without proper verification
      const [, payloadBase64] = token.split(".");
      if (!payloadBase64) throw new Error("Invalid token format");
      const payload = JSON.parse(atob(payloadBase64));
      setUser({
        userId: payload.userId,
        username: payload.username,
        email: payload.email,
        fullName: payload.fullName,
      });
    } catch (error) {
      console.error("Token decode error:", error);
      localStorage.removeItem("token");
      router.push("/login");
    }
  }, [router]);
  //IMPROVED: token verification should be done on the server side
  //IMPROVED: use a proper token verification method

  const handleLogout = () => {
    // Bad practice: no proper cleanup
    localStorage.removeItem("token");
    setUser(null);
    setShowDropdown(false);
    // Clear all user-related data from localStorage/sessionStorage if any
    localStorage.removeItem("user");
    sessionStorage.clear();
    router.push("/login");
    //IMPROVED: redirect to login page after logout
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/users" className="text-xl font-bold text-gray-800">
              Workshop App
            </Link>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
              >
                <span className="text-sm font-medium">Hi, {user.username}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Update Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bad practice: click outside handler without useCallback > ALREADY IMPROVED*/}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClickOutside}
        />
      )}

      
    </nav>
  );
}
