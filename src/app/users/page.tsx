"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

// Bad practice: global variable for API URL
const API_URL = "http://localhost:3000/api/users";

// Bad practice: no proper TypeScript interfaces (OLD - COMMENTED OUT)
enum Division {
  TECH = 'Tech',
  QA = 'QA',
  HR = 'HR',
  MARKETING = 'Marketing',
  FINANCE = 'Finance',
  SALES = 'Sales',
  OPERATIONS = 'Operations',
  LEGAL = 'Legal',
  DESIGN = 'Design',
  PRODUCT = 'Product'
}

// Core user entity
interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  birthDate: Date;
  bio?: string;
  longBio?: string;
  address?: string;
  division?: Division;
  createdAt: Date;
  updatedAt: Date;
}

// Separate interface for aggregated data
interface UserStats {
  totalUsers: number;
  newerUsers: number;
}

// Combined interface for display purposes
interface UserWithStats extends User {
  stats: UserStats;
}

// API response types (with string dates)
interface UserApiResponse {
  id: number;
  username: string;
  fullName: string;
  email: string;
  birthDate: string;
  bio?: string;
  longBio?: string;
  address?: string;
  division?: string;
  createdAt: string;
  updatedAt: string;
  totalUsers: number;
  newerUsers: number;
}

// Transform function
const transformUserFromApi = (apiUser: UserApiResponse): UserWithStats => ({
  id: apiUser.id,
  username: apiUser.username,
  fullName: apiUser.fullName,
  email: apiUser.email,
  birthDate: new Date(apiUser.birthDate),
  bio: apiUser.bio,
  longBio: apiUser.longBio,
  address: apiUser.address,
  division: apiUser.division as Division,
  createdAt: new Date(apiUser.createdAt),
  updatedAt: new Date(apiUser.updatedAt),
  stats: {
    totalUsers: apiUser.totalUsers,
    newerUsers: apiUser.newerUsers
  }
});



// For backward compatibility, keep using UserData as alias
type UserData = UserApiResponse;
// Improved TypeScript interfaces


// Bad practice: component with poor naming and no optimization
export default function UsersPageComponent() {
  // Bad practice: multiple state variables instead of useReducer
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [divisionFilter, setDivisionFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const [fetchCount, setFetchCount] = useState<number>(0);

  const { requireAuth } = useAuth();

  useEffect(() => {
    requireAuth("/login");
  }, []); // Empty dependency array ensures this runs only once on mount
  // IMPROVED: Good practice: Check auth only once on mount-----------

  // Bad practice: hardcoded fetch function with no error handling optimization
  const fetchUsersData = async () => {
    console.time("Users Page Fetch");
    setLoadingState(true);
    setErrorMessage("");

    try {
      const url = new URL(API_URL);
      if (divisionFilter !== "all") {
        url.searchParams.append("division", divisionFilter);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      // REFACTORED: Improved fetch with timeout and better URL construction-------

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Bad practice: no validation of response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format: expected object');
      }

      // Validate response structure
      if (!Array.isArray(data.users)) {
        throw new Error('Invalid response format: users must be an array');
      }

      if (typeof data.total !== 'number' || data.total < 0) {
        throw new Error('Invalid response format: total must be a non-negative number');
      }

      // Validate each user object
      const validatedUsers = data.users.filter((user: any) => {
        return user &&
               typeof user === 'object' &&
               typeof user.id === 'number' &&
               typeof user.username === 'string' &&
               typeof user.fullName === 'string' &&
               typeof user.email === 'string';
      });

      if (validatedUsers.length !== data.users.length) {
        console.warn(`Filtered out ${data.users.length - validatedUsers.length} invalid user records`);
      }

      // Update state with validated data
      setUsersData(validatedUsers);
      setTotalCount(data.total);
      setLastFetchTime(new Date());
      setFetchCount((prev) => prev + 1);
      // IMPROVED: Better data validation and error handling-----------------------

    } catch (error) {
      // Bad practice: generic error handling
      console.error("Fetch error:", error);
      
      let specificErrorMessage = "Failed to load users data";
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          specificErrorMessage = "Request timeout - The server took too long to respond. Please try again.";
        } else if (error.message.includes('HTTP error! status: 404')) {
          specificErrorMessage = "Users service not found. Please contact support if this persists.";
        } else if (error.message.includes('HTTP error! status: 500')) {
          specificErrorMessage = "Server error occurred. Please try again in a few moments.";
        } else if (error.message.includes('HTTP error! status: 403')) {
          specificErrorMessage = "Access denied. You may not have permission to view this data.";
        } else if (error.message.includes('HTTP error! status: 401')) {
          specificErrorMessage = "Authentication failed. Please log in again.";
        } else if (error.message.includes('Invalid response format')) {
          specificErrorMessage = "Received invalid data format from server. Please try refreshing the page.";
        } else if (error.message.includes('Failed to fetch')) {
          specificErrorMessage = "Network error - Please check your internet connection and try again.";
        } else if (error.message.includes('HTTP error! status:')) {
          const statusMatch = error.message.match(/status: (\d+)/);
          const status = statusMatch ? statusMatch[1] : 'unknown';
          specificErrorMessage = `Server responded with error ${status}. Please try again later.`;
        } else {
          specificErrorMessage = `Error: ${error.message}. Please try again or contact support.`;
        }
      } else {
        specificErrorMessage = "An unexpected error occurred. Please try again or contact support.";
      }
      // IMPROVED: Specific error messages based on error type-------------------

      setErrorMessage(specificErrorMessage);
    } finally {
      setLoadingState(false);
      console.timeEnd("Users Page Fetch");
    }
  };

  // Bad practice: useEffect with no dependencies array optimization
  useEffect(() => {
    fetchUsersData();
  }, [divisionFilter]);

  // Bad practice: inefficient filtering and sorting logic
  const getFilteredAndSortedUsers = () => {
    let filteredUsers = [...usersData];

    // Bad practice: inefficient filtering with multiple conditions
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter((user) => {
        return (
          user.fullName.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.bio && user.bio.toLowerCase().includes(searchLower)) ||
          (user.address && user.address.toLowerCase().includes(searchLower))
        );
      });
    }
  // IMPROVED: Efficient filtering with OR conditions

    // Bad practice: inefficient sorting with multiple conditions
    const sortFunctions = {
      createdAt: (a: UserData, b: UserData) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      fullName: (a: UserData, b: UserData) => 
        a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }),
      username: (a: UserData, b: UserData) => 
        a.username.localeCompare(b.username, undefined, { sensitivity: 'base' }),
      division: (a: UserData, b: UserData) => 
        (a.division || "").localeCompare((b.division || ""), undefined, { sensitivity: 'base' })
    };
    // IMPROVED: Efficient sorting with multiple conditions

    const sortFunction = sortFunctions[sortBy as keyof typeof sortFunctions];
    if (sortFunction) {
      filteredUsers.sort(sortFunction);
    }
    // IMPROVED: Efficient sorting with a single function call
    return filteredUsers;
  };

  // Bad practice: inefficient pagination calculation
  const getPaginatedUsers = useMemo(() => {
    const filteredUsers = getFilteredAndSortedUsers();
    const startIndex = (currentPage - 1) * itemsPerPage;
    // Optimize by avoiding unnecessary slice operations
    if (startIndex >= filteredUsers.length) {
      return [];
    }
    const endIndex = Math.min(startIndex + itemsPerPage, filteredUsers.length);
    return filteredUsers.slice(startIndex, endIndex);
  }, [usersData, searchTerm, sortBy, divisionFilter, currentPage, itemsPerPage]);
  // IMPROVED: Efficient pagination calculation with useMemo

  // Bad practice: inefficient pagination info calculation
  const getPaginationInfo = useMemo(() => {
    const filteredUsers = getFilteredAndSortedUsers();
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      totalPages,
      startIndex,
      endIndex,
      totalItems,
    };
  }, [usersData, searchTerm, sortBy, divisionFilter, currentPage, itemsPerPage]);
  // IMPROVED: Efficient pagination info calculation with useMemo

  // Bad practice: inefficient date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Use toLocaleDateString and toLocaleTimeString for better formatting
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    const formattedDate = date.toLocaleDateString('en-CA', dateOptions); // en-CA gives YYYY-MM-DD format
    const formattedTime = date.toLocaleTimeString('en-GB', timeOptions); // en-GB gives HH:MM format
    
    return `${formattedDate} ${formattedTime}`;
  };
  // IMPROVED: Efficient date formatting using toLocaleDateString and toLocaleTimeString

  // Bad practice: inefficient user card rendering
  const renderUserCard = useMemo(() => {
    // Define styles outside of render function to prevent re-creation
    const baseCardStyle = {
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "16px",
      margin: "8px 0",
      transition: "box-shadow 0.2s ease-in-out",
      cursor: "pointer",
    };

    const evenCardStyle = {
      ...baseCardStyle,
      backgroundColor: "#f9f9f9",
    };

    const oddCardStyle = {
      ...baseCardStyle,
      backgroundColor: "#ffffff",
    };

    const cardHeaderStyle = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "16px",
    };

    const userInfoStyle = {
      flex: 1,
    };

    const titleStyle = {
      margin: "0 0 8px 0",
      fontSize: "18px",
      fontWeight: "bold",
      color: "#333",
    };

    const fieldStyle = {
      margin: "0 0 4px 0",
      color: "#666",
    };

    const metaStyle = {
      margin: "0 0 4px 0",
      color: "#999",
      fontSize: "12px",
    };

    const statsStyle = {
      textAlign: "right" as const,
      fontSize: "12px",
      color: "#999",
      minWidth: "120px",
    };

    return (user: UserData, index: number) => {
      const cardStyle = index % 2 === 0 ? evenCardStyle : oddCardStyle;

      // Helper function to render field with optional value
      const renderField = (label: string, value: string | undefined, style = fieldStyle) => {
        if (!value) return null;
        return (
          <p style={style}>
            <strong>{label}:</strong> {value}
          </p>
        );
      };

      // Truncate long bio with proper ellipsis
      const truncatedLongBio = user.longBio 
        ? user.longBio.length > 100 
          ? `${user.longBio.substring(0, 100)}...`
          : user.longBio
        : undefined;

      return (
        <div 
          key={user.id} 
          style={cardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={cardHeaderStyle}>
            <div style={userInfoStyle}>
              <h3 style={titleStyle}>{user.fullName}</h3>
              
              {renderField("Username", user.username)}
              {renderField("Email", user.email)}
              {renderField("Birth Date", user.birthDate)}
              {renderField("Division", user.division)}
              {renderField("Address", user.address)}
              {renderField("Bio", user.bio)}
              {renderField("Long Bio", truncatedLongBio)}
              
              {renderField("Created", formatDate(user.createdAt), metaStyle)}
              {renderField("Updated", formatDate(user.updatedAt), metaStyle)}
            </div>
            
            <div style={statsStyle}>
              <div style={{ marginBottom: "4px" }}>
                <strong>Total Users:</strong> {user.totalUsers}
              </div>
              <div>
                <strong>Newer Users:</strong> {user.newerUsers}
              </div>
            </div>
          </div>
        </div>
      );
    };
  }, []);
  // IMPROVED: Memoized card renderer with better styling and performance
  // IMPROVED: Efficient user card rendering with better structure and performance


  // Bad practice: inefficient pagination controls
  const renderPaginationControls = () => {
    const paginationInfo = getPaginationInfo;

    if (paginationInfo.totalPages <= 1) {
      return null;
    }

    const pageNumbers = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(
      paginationInfo.totalPages,
      startPage + maxVisiblePages - 1
    );

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div
        style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}
      >
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            margin: "0 4px",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: currentPage === 1 ? "#f5f5f5" : "#fff",
            cursor: currentPage === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => setCurrentPage(pageNumber)}
            style={{
              margin: "0 4px",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: currentPage === pageNumber ? "#007bff" : "#fff",
              color: currentPage === pageNumber ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            {pageNumber}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === paginationInfo.totalPages}
          style={{
            margin: "0 4px",
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor:
              currentPage === paginationInfo.totalPages ? "#f5f5f5" : "#fff",
            cursor:
              currentPage === paginationInfo.totalPages
                ? "not-allowed"
                : "pointer",
          }}
        >
          Next
        </button>
      </div>
    );
  };
  // IMPROVED: Efficient pagination controls with better UX and performance

  // Bad practice: inefficient filter controls
  const renderFilterControls = () => {
    return (
      <div
        style={{
          margin: "20px 0",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Search:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "200px",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "150px",
              }}
            >
              <option value="createdAt">Created Date</option>
              <option value="fullName">Full Name</option>
              <option value="username">Username</option>
              <option value="division">Division</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Division Filter:
            </label>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "150px",
              }}
            >
              <option value="all">All Divisions</option>
              <option value="Tech">Tech</option>
              <option value="QA">QA</option>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Legal">Legal</option>
              <option value="Design">Design</option>
              <option value="Product">Product</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontWeight: "bold",
              }}
            >
              Items Per Page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "100px",
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchUsersData();
              setTimeout(() => setIsRefreshing(false), 1000);
            }}
            disabled={isRefreshing}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: isRefreshing ? "not-allowed" : "pointer",
              opacity: isRefreshing ? 0.6 : 1,
            }}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    );
  };
  // IMPROVED: Efficient filter controls with better UX and performance
  
  if (loadingState) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>
            Loading users...
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Please wait while we fetch the data
          </div>
        </div>
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div
            style={{ fontSize: "24px", color: "#dc3545", marginBottom: "16px" }}
          >
            Error: {errorMessage}
          </div>
          <button
            onClick={fetchUsersData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  const paginatedUsers = getPaginatedUsers;
  const paginationInfo = getPaginationInfo;

  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Users List</h1>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            Total: {totalCount} users | Showing: {paginationInfo.startIndex}-
            {paginationInfo.endIndex} of {paginationInfo.totalItems} filtered
            results
          </p>
          <p style={{ color: "#999", fontSize: "12px" }}>
            Last fetched: {lastFetchTime.toLocaleString()} | Fetch count:{" "}
            {fetchCount}
          </p>
        </div>

        {renderFilterControls()}

        <div style={{ marginBottom: "20px" }}>
          {paginatedUsers.map((user, index) => renderUserCard(user, index))}
        </div>

        {renderPaginationControls()}

        <div style={{ marginTop: "20px", textAlign: "center", color: "#666" }}>
          <p>
            This page demonstrates poor performance practices for refactoring
            practice.
          </p>
          <p>Check the console for timing information.</p>
        </div>
      </div>
    </>
  );
}
