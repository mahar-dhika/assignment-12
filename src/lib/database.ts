import { Pool } from "pg";

// Database configuration - intentionally unoptimized for workshop
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
  // SSL configuration for remote databases (like Render)
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('render.com') ? { rejectUnauthorized: false } : false,
  // Bad practice: no connection pooling limits for demo
  max: 10, // Set a reasonable pool size
  idleTimeoutMillis: 10000, // Release idle clients after 10 seconds
  connectionTimeoutMillis: 2000,
  //IMPROVED: Use connection pooling for better performance
});

// Log database configuration for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Database Configuration:");
  console.log("Host:", process.env.DB_HOST || "localhost");
  console.log("Port:", process.env.DB_PORT || "5432");
  console.log("User:", process.env.DB_USER || "postgres");
  console.log("Database:", process.env.DB_NAME || "workshop_db");
  console.log("Password:", process.env.DB_PASSWORD ? "***" : "admin123");
}

// Bad practice: raw SQL queries without proper error handling
interface QueryConfig {
  text: string;
  values?: any[];
}

export async function executeQuery<T = any>(config: QueryConfig): Promise<T[]> {
  console.time("Database Query Execution");
  const client = await pool.connect();
  try {
    const result = await client.query(config);
    console.timeEnd("Database Query Execution");
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw new Error("Database query failed");
  } finally {
    client.release();
  }
}
//IMPROVED: Use not raw SQL queries, handle errors properly, and ensure connection release

// Bad practice: no connection pooling management
// Properly close the connection pool when shutting down the application
export async function closePool() {
  try {
    await pool.end();
    if (process.env.NODE_ENV === "development") {
      console.log("Database connection pool closed.");
    }
  } catch (error) {
    console.error("Error closing database pool:", error);
  }
}
//IMPROVED: Use connection pooling to manage database connections efficiently

// Initialize database tables
export async function initializeDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      birth_date DATE,
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await executeQuery({ text: createUsersTable });
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
