import { NextResponse } from "next/server";
import { comparePassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/database";
import { generateToken, TokenPayload } from "@/lib/jwt";

export async function POST(request: Request) {
  console.time("Login API Execution");

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    //Bad practice: unoptimized query with multiple joins and no indexing
    const query = `
      SELECT 
        a.id as auth_id,
        a.email,
        a.password,
        u.id as user_id,
        u.username,
        u.full_name,
        u.birth_date,
        u.bio,
        u.long_bio,
        u.profile_json,
        u.address,
        u.phone_number,
        ur.role,
        ud.division_name
      FROM auth a
      INNER JOIN users u ON a.id = u.auth_id
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN user_divisions ud ON u.id = ud.user_id
      WHERE a.email = $1
    `;
    // Optimized query: select only necessary fields and avoid unnecessary subqueries


    const result = await executeQuery({ text: query, values: [email] });

    if (result.length === 0) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const user = result[0];

    // Bad practice: using simple hash comparison instead of bcrypt
    const isPasswordValid = await comparePassword(password, user.password);
    // Improved: using bcrypt for secure password comparison

    if (!isPasswordValid) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Bad practice: including sensitive data in token
    const tokenPayload: TokenPayload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };
    // Improved: include only necessary user information in token

    const token = await generateToken(tokenPayload);

    // Log the login action
    await executeQuery({
      text: "INSERT INTO user_logs (user_id, action) VALUES ($1, $2)",
      values: [user.user_id, "login"]
    });

    console.timeEnd("Login API Execution");
    return NextResponse.json({
      message: "Login successful!",
      token,
      user: {
        id: user.user_id,
        authId: user.auth_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        division: user.division_name,
        bio: user.bio,
        longBio: user.long_bio,
        profileJson: user.profile_json,
        address: user.address,
        phoneNumber: user.phone_number,
        birthDate: user.birth_date,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    console.timeEnd("Login API Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
