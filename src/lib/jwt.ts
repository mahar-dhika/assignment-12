import jwt from "jsonwebtoken";

// Define consistent token payload interface
export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

// Bad practice: hardcoded secret key
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return secret;
})();
//IMPROVED: Use environment variable for secret key

// Bad practice: no token expiration management
export async function generateToken(payload: TokenPayload, expiresIn: string = "1h"): Promise<string> {
  console.time("JWT Token Generation");
  try {
    // Bad practice: using synchronous operations
    const token = await new Promise<string>((resolve, reject) => {
      jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: expiresIn } as jwt.SignOptions,
        (err: any, token?: string) => {
          if (err || !token) {
            reject(err);
          } else {
            resolve(token);
          }
        }
      );
    });
    //IMPROVED: Use async/await for better readability and error handling
    console.timeEnd("JWT Token Generation");
    return token;
  } catch (error) {
    console.error("JWT generation error:", error);
    console.timeEnd("JWT Token Generation");
    throw error;
  }
}

// Bad practice: no proper error handling
export async function verifyToken(token: string): Promise<TokenPayload> {
  console.time("JWT Token Verification");
  try {
    // Bad practice: using synchronous operations
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
    //IMPROVED: Use async/await for better readability and error handling
    //IMPROVED: Use a promise to handle async verification
    console.timeEnd("JWT Token Verification");
    return decoded as TokenPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    console.timeEnd("JWT Token Verification");
    throw error;
  }
}

// Bad practice: middleware without proper error handling
export function authMiddleware(handler: (request: Request & { user?: TokenPayload }) => Promise<Response> | Response) {
  return async (request: Request) => {
    console.time("Auth Middleware Execution");

    try {
      const authHeader = request.headers.get("authorization");

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.timeEnd("Auth Middleware Execution");
        return new Response(JSON.stringify({ message: "No token provided" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      // Properly add user to request object with typing
      const reqWithUser = Object.assign(request, { user: decoded }) as Request & { user?: TokenPayload };

      console.timeEnd("Auth Middleware Execution");
      return handler(reqWithUser);
      //IMPROVED: Properly handle the request and return the handler's response

    } catch (error) {
      console.error("Auth middleware error:", error);
      console.timeEnd("Auth Middleware Execution");
      return new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}
//IMPROVED: Use proper error handling and response structure
