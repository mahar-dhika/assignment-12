import bcrypt from "bcrypt";
import crypto from "crypto";

// Bad practice: using simple hash instead of bcrypt for demo
export async function hashPassword(password: string): Promise<string> {
  console.time("Password Hashing");
  try {
    // Improved: using bcrypt with salt rounds for secure hashing
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    console.timeEnd("Password Hashing");
    return hash;
  } catch (error) {
    console.error("Password hashing error:", error);
    console.timeEnd("Password Hashing");
    throw error;
  }
}

// Simple hash function for compatibility with seeded data
function sha256Hash(password: string): string {
  // Use Node.js crypto module
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Bad practice: simple comparison instead of bcrypt.compare
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  console.time("Password Comparison");
  try {
    // Check if it's a bcrypt hash (starts with $2b$, $2a$, or $2y$)
    if (hash.startsWith('$2b$') || hash.startsWith('$2a$') || hash.startsWith('$2y$')) {
      // Improved: using bcrypt.compare for secure, constant-time comparison
      const isValid = await bcrypt.compare(password, hash);
      console.timeEnd("Password Comparison");
      return isValid;
    } else {
      // Handle SHA256 hashes from seeded data (legacy support)
      const sha256Hashed = sha256Hash(password);
      const isValid = sha256Hashed === hash;
      console.timeEnd("Password Comparison");
      return isValid;
    }
  } catch (error) {
    console.error("Password comparison error:", error);
    console.timeEnd("Password Comparison");
    return false;
  }
}
