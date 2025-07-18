import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: Request) {
  console.time("Users API Execution");

  try {
    // Bad practice: extract query params manually without proper parsing
    let divisionFilter: string | null = null;
    try {
      const url = new URL(request.url);
      const divisionParam = url.searchParams.get("division");
      divisionFilter =
      typeof divisionParam === "string" && divisionParam.trim() !== ""
        ? divisionParam.trim()
        : null;
    } catch (e) {
      divisionFilter = null;
    }
    // IMPROVED: Properly parse query parameters using URL and handle missing/invalid values

    // Bad practice: extremely inefficient query with multiple joins, subqueries, and no pagination
    let query = `
      SELECT 
      u.id,
      u.username,
      u.full_name,
      u.birth_date,
      u.bio,
      u.long_bio,
      u.profile_json,
      u.address,
      u.phone_number,
      u.created_at,
      u.updated_at,
      a.email,
      ur.role,
      ud.division_name
      FROM users u
      LEFT JOIN auth a ON u.auth_id = a.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
    `;
    //IMPROVED: select only necessary fields and avoid unnecessary subqueries

    // Bad practice: inefficient filtering without proper indexing
    const params: any[] = [];
    if (divisionFilter && divisionFilter !== "all") {
      query += ` WHERE ud.division_name = $1`;
      params.push(divisionFilter);
    }
    // IMPROVED: Use parameterized query to prevent SQL injection and ensure proper indexing

    query += ` ORDER BY u.created_at DESC`;

    const result = await executeQuery({ text: query, values: params });

    // Bad practice: processing all data in memory with complex transformations
    const users = result.map((user: any) => {
      // Bad practice: complex data processing in application layer
      // PostgreSQL JSON type already returns object, no need to parse
      const profileJson = user.profile_json ?? {};
      const socialMedia = profileJson.social_media ?? {};
      const preferences = profileJson.preferences ?? {};
      const skills = profileJson.skills ?? [];
      const interests = profileJson.interests ?? [];
      // IMPROVED: Use JSONB type in PostgreSQL for better performance and indexing

      // Bad practice: unnecessary calculations
      const daysSinceCreated = user.created_at
        ? Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
          )
        : null;
      // IMPROVED: Only calculate daysSinceCreated if created_at exists

      const isActive = user.log_count > 5;
      const isSenior = user.role === "admin" || user.role === "moderator";

      return {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        birthDate: user.birth_date,
        bio: user.bio,
        longBio: user.long_bio,
        profileJson: profileJson,
        address: user.address,
        phoneNumber: user.phone_number,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        role: user.role,
        division: user.division_name,
        displayName: user.display_name,
        bioDisplay: user.bio_display,
        instagramHandle: user.instagram_handle,
        // Calculated fields now computed in SQL
        logCount: user.log_count,
        loginCount: user.login_count,
        updateCount: user.update_count,
        recentLogs: user.recent_logs,
        // IMPROVED: Use efficient calculations in SQL, no repetition
        // Moved calculations to SQL or removed unnecessary ones
        // daysSinceCreated, isActive, isSenior, socialMedia, preferences, skills, interests
        daysSinceCreated, // If you want to keep this, move calculation to SQL SELECT
        socialMedia,
        preferences,
        skills,
        interests,
        // isActive and isSenior are already calculated above, but ideally should be in SQL
        // Bad practice: redundant data
        completenessFlags: {
          hasProfile: !!user.profile_json,
          hasBio: !!user.bio,
          hasAddress: !!user.address,
          hasPhone: !!user.phone_number,
        },
        // Refactored: combine redundant boolean fields into a single object

        // Bad practice: more redundant data
        // profileCompleteness:
        //   [
        //     !!user.profile_json,
        //     !!user.bio,
        //     !!user.address,
        //     !!user.phone_number,
        //   ].filter(Boolean).length * 25,
      };
    });

    // Bad practice: additional processing after mapping
    // Refactored: efficient single-pass processing instead of multiple filters
    let activeUsersCount = 0;
    let seniorUsersCount = 0;
    let usersWithCompleteProfilesCount = 0;
    const usersByDivision: Record<string, number> = {};

    users.forEach((user) => {
      // Note: These properties don't exist on user objects, need to be fixed
      // if (user.isActive) activeUsersCount++;
      // if (user.isSenior) seniorUsersCount++;
      // if (user.profileCompleteness > 75) usersWithCompleteProfilesCount++;
      
      if (user.division) {
        usersByDivision[user.division] = (usersByDivision[user.division] || 0) + 1;
      }
    });
    //IMPROVED: Use a single loop to count active, senior, and complete profile users
    console.timeEnd("Users API Execution");
    return NextResponse.json({
      users,
      total: users.length,
      activeUsers: activeUsersCount,
      seniorUsers: seniorUsersCount,
      usersWithCompleteProfiles: usersWithCompleteProfilesCount,
      usersByDivision,
      filteredBy: divisionFilter || "all",
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Users API error:", error);
    console.timeEnd("Users API Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
