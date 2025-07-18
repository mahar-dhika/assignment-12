import { NextResponse } from "next/server";
import { comparePassword, hashPassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/database";
import { authMiddleware, TokenPayload } from "@/lib/jwt";

async function updatePassword(request: Request) {
  console.time("Password Update Execution");

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Bad practice: getting user from request without proper typing
    interface AuthenticatedRequest extends Request {
      user: TokenPayload;
    }
    const { user } = request as AuthenticatedRequest;
    //IMPROVED: use auth middleware to get user information


    // Bad practice: inefficient query to get current password
    const getPasswordQuery = `
      SELECT password_hash FROM users WHERE id = $1 LIMIT 1
    `;
    // IMPROVED: select only necessary fields and avoid unnecessary subqueries

    const passwordResult = await executeQuery({
      text: getPasswordQuery,
      values: [user.userId]
    });

    if (passwordResult.length === 0) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const currentPasswordHash = passwordResult[0].password_hash;

    // Bad practice: using simple hash comparison instead of bcrypt
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      currentPasswordHash
    );
    // IMPROVED: use bcrypt for password comparison

    if (!isCurrentPasswordValid) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // Bad practice: using simple hash instead of bcrypt
    const newPasswordHash = await hashPassword(newPassword);
    // IMPROVED: use bcrypt for hashing new password

    // Bad practice: inefficient update query
    const updatePasswordQuery = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;
    // IMPROVED: use parameterized query to prevent SQL injection

    await executeQuery({
      text: updatePasswordQuery,
      values: [newPasswordHash, user.userId]
    });

    console.timeEnd("Password Update Execution");
    return NextResponse.json({
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Password update error:", error);
    console.timeEnd("Password Update Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

// Bad practice: wrapping with auth middleware
export const POST = authMiddleware(updatePassword);
//Actually good practice
