// Quick test to verify JWT payload consistency
const jwt = require('jsonwebtoken');

// Sample payload structure
const payload = {
  userId: "123",
  username: "testuser",
  email: "test@example.com", 
  fullName: "Test User",
  role: "user"
};

const secret = "test-secret";

// Test token generation
const token = jwt.sign(payload, secret, { expiresIn: "1h" });
console.log("Generated token:", token);

// Test token verification
const decoded = jwt.verify(token, secret);
console.log("Decoded payload:", decoded);

// Check if all required fields are present
const requiredFields = ['userId', 'username', 'email', 'fullName', 'role'];
const hasAllFields = requiredFields.every(field => decoded.hasOwnProperty(field));

console.log("Has all required fields:", hasAllFields);
console.log("Payload structure is consistent:", JSON.stringify(decoded, null, 2));
