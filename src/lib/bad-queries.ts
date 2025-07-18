// Bad queries for optimization practice - Session 11 & 12
// These queries are intentionally inefficient to demonstrate optimization techniques

export const badQueries = {
  // Bad practice: Nested if-else structure for user data processing
  getUserDataWithNestedLogic: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.profile_json,
      u.address,
      u.phone_number,
      a.email,
      ur.role,
      ud.division_name,
      -- Bad practice: multiple subqueries for the same data
      COALESCE(logs.log_count, 0) as log_count,
      COALESCE(logs.login_count, 0) as login_count,
      COALESCE(logs.update_count, 0) as update_count,
      COALESCE(logs.logout_count, 0) as logout_count,
      -- Bad practice: unnecessary string concatenations
      CONCAT(u.full_name, ' (', COALESCE(ur.role, 'no role'), ')') as display_name,
      CONCAT(u.username, '@', a.email) as user_identifier,
      -- Bad practice: complex CASE statements that could be simplified
      CASE 
        WHEN u.bio IS NULL THEN 'No bio available'
        WHEN u.bio = '' THEN 'Empty bio'
        WHEN LENGTH(u.bio) < 10 THEN 'Short bio'
        WHEN LENGTH(u.bio) < 50 THEN 'Medium bio'
        ELSE 'Long bio'
      END as bio_status,
      -- Bad practice: nested CASE statements
      CASE 
        WHEN ur.role = 'admin' THEN 'Administrator'
        WHEN ur.role = 'moderator' THEN 'Moderator'
        WHEN ur.role = 'editor' THEN 'Editor'
        WHEN ur.role = 'viewer' THEN 'Viewer'
        WHEN ur.role = 'user' THEN 'Regular User'
        ELSE 'Unknown Role'
      END as role_display,
      -- Bad practice: complex JSON operations without proper indexing
      CASE 
        WHEN u.profile_json IS NOT NULL AND u.profile_json->'social_media' IS NOT NULL AND u.profile_json->'social_media'->>'instagram' IS NOT NULL
          THEN u.profile_json->'social_media'->>'instagram'
        WHEN u.profile_json IS NOT NULL AND u.profile_json->'social_media' IS NOT NULL
          THEN 'No Instagram'
        WHEN u.profile_json IS NOT NULL
          THEN 'No social media'
        ELSE 'No profile data'
      END as instagram_handle,
      -- Bad practice: date calculations in SQL
      DATE_PART('day', NOW() - u.created_at) as days_since_created,
      DATE_PART('month', NOW() - u.created_at) as months_since_created,
      DATE_PART('year', NOW() - u.created_at) as years_since_created
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as log_count,
        COUNT(*) FILTER (WHERE action = 'login') as login_count,
        COUNT(*) FILTER (WHERE action = 'update_profile') as update_count,
        COUNT(*) FILTER (WHERE action = 'logout') as logout_count
      FROM user_logs
      GROUP BY user_id
    ) logs ON logs.user_id = u.id
    -- Bad practice: unnecessary CROSS JOIN
    CROSS JOIN (SELECT 1 as dummy) d
    -- Bad practice: no WHERE clause for filtering
    ORDER BY u.created_at DESC
  `,
  //IMPROVED: Use proper indexing, avoid unnecessary subqueries, and simplify logic

  // Bad practice: Complex nested subqueries for user statistics
  getUserStatisticsWithNestedSubqueries: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      -- Bad practice: multiple subqueries for related data
      COALESCE(stats.total_logs, 0) as total_logs,
      COALESCE(stats.login_logs, 0) as login_logs,
      COALESCE(stats.logout_logs, 0) as logout_logs,
      COALESCE(stats.update_logs, 0) as update_logs,
      COALESCE(stats.view_logs, 0) as view_logs,
      COALESCE(stats.export_logs, 0) as export_logs,
      -- Bad practice: nested subqueries for date-based calculations
      COALESCE(stats.recent_logs_7d, 0) as recent_logs_7d,
      COALESCE(stats.recent_logs_30d, 0) as recent_logs_30d,
      COALESCE(stats.recent_logs_90d, 0) as recent_logs_90d,
      -- Bad practice: subqueries for role and division counts
      COALESCE(urc.role_count, 0) as role_count,
      COALESCE(udc.division_count, 0) as division_count,
      -- Bad practice: complex conditional subqueries
      COALESCE(stats.today_auth_actions, 0) as today_auth_actions,
      -- Bad practice: subquery for user activity score
      CASE 
        WHEN COALESCE(stats.total_logs, 0) > 50 THEN 'Very Active'
        WHEN COALESCE(stats.total_logs, 0) > 20 THEN 'Active'
        WHEN COALESCE(stats.total_logs, 0) > 5 THEN 'Moderate'
        ELSE 'Inactive'
      END as activity_level
    FROM users u
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE action = 'login') as login_logs,
        COUNT(*) FILTER (WHERE action = 'logout') as logout_logs,
        COUNT(*) FILTER (WHERE action = 'update_profile') as update_logs,
        COUNT(*) FILTER (WHERE action = 'view_users') as view_logs,
        COUNT(*) FILTER (WHERE action = 'export_data') as export_logs,
        COUNT(*) FILTER (
          WHERE created_at > NOW() - INTERVAL '7 days'
        ) as recent_logs_7d,
        COUNT(*) FILTER (
          WHERE created_at > NOW() - INTERVAL '30 days'
        ) as recent_logs_30d,
        COUNT(*) FILTER (
          WHERE created_at > NOW() - INTERVAL '90 days'
        ) as recent_logs_90d,
        COUNT(*) FILTER (
          WHERE action IN ('login', 'logout') AND created_at > NOW() - INTERVAL '24 hours'
        ) as today_auth_actions
      FROM user_logs
      GROUP BY user_id
    ) stats ON stats.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as role_count
      FROM user_roles
      GROUP BY user_id
    ) urc ON urc.user_id = u.id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as division_count
      FROM user_divisions
      GROUP BY user_id
    ) udc ON udc.user_id = u.id
    -- Bad practice: no WHERE clause, processing all users
    ORDER BY u.created_at DESC
  `,
  //IMPROVED: Use simplified nested queries, avoid unnecessary subqueries, and ensure proper indexing

  // Bad practice: Complex data cleaning query with multiple conditions
  getDataForCleaning: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.address,
      u.phone_number,
      u.profile_json,
      a.email,
      ur.role,
      ud.division_name,
      -- Bad practice: complex NULL checking with multiple conditions
      CASE 
        WHEN u.bio IS NULL THEN 'MISSING_BIO'
        WHEN u.bio = '' THEN 'EMPTY_BIO'
        WHEN LENGTH(TRIM(u.bio)) < 3 THEN 'SHORT_BIO'
        WHEN u.bio LIKE '%test%' OR u.bio LIKE '%demo%' OR u.bio LIKE '%example%' THEN 'TEST_BIO'
        ELSE 'VALID_BIO'
      END as bio_status,
      -- Bad practice: complex phone number validation
      CASE 
        WHEN u.phone_number IS NULL THEN 'MISSING_PHONE'
        WHEN u.phone_number = '' THEN 'EMPTY_PHONE'
        WHEN u.phone_number NOT LIKE '+62%' THEN 'INVALID_FORMAT'
        WHEN LENGTH(u.phone_number) < 10 THEN 'TOO_SHORT'
        WHEN LENGTH(u.phone_number) > 15 THEN 'TOO_LONG'
        WHEN u.phone_number ~ '^[0-9+]+$' = false THEN 'INVALID_CHARS'
        ELSE 'VALID_PHONE'
      END as phone_status,
      -- Bad practice: complex address validation
      CASE 
        WHEN u.address IS NULL THEN 'MISSING_ADDRESS'
        WHEN u.address = '' THEN 'EMPTY_ADDRESS'
        WHEN LENGTH(TRIM(u.address)) < 10 THEN 'SHORT_ADDRESS'
        WHEN u.address NOT LIKE ANY (ARRAY['%Jakarta%', '%Bandung%', '%Surabaya%', '%Medan%', '%Semarang%']) THEN 'UNKNOWN_CITY'
        ELSE 'VALID_ADDRESS'
      END as address_status,
      -- Bad practice: complex JSON validation
      CASE 
        WHEN u.profile_json IS NULL THEN 'MISSING_PROFILE'
        WHEN u.profile_json = '{}' THEN 'EMPTY_PROFILE'
        WHEN COALESCE(u.profile_json->>'social_media', '') = '' THEN 'NO_SOCIAL_MEDIA'
        WHEN COALESCE(u.profile_json->'social_media'->>'instagram', '') = '' THEN 'NO_INSTAGRAM'
        ELSE 'VALID_PROFILE'
      END as profile_status,
      -- Bad practice: duplicate detection
      bio_duplicates.count as bio_duplicates,
      address_duplicates.count as address_duplicates,
      phone_duplicates.count as phone_duplicates
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    LEFT JOIN (
      SELECT bio, COUNT(*) as count
      FROM users
      WHERE bio IS NOT NULL
      GROUP BY bio
      HAVING COUNT(*) > 1
    ) bio_duplicates ON bio_duplicates.bio = u.bio
    LEFT JOIN (
      SELECT address, COUNT(*) as count
      FROM users
      WHERE address IS NOT NULL
      GROUP BY address
      HAVING COUNT(*) > 1
    ) address_duplicates ON address_duplicates.address = u.address
    LEFT JOIN (
      SELECT phone_number, COUNT(*) as count
      FROM users
      WHERE phone_number IS NOT NULL
      GROUP BY phone_number
      HAVING COUNT(*) > 1
    ) phone_duplicates ON phone_duplicates.phone_number = u.phone_number
    -- Bad practice: no WHERE clause, processing all data
    ORDER BY u.created_at DESC
  `,
  // IMPROVED: Use better data cleaning techniques, avoid complex conditions, and ensure proper indexing

  // Bad practice: Performance testing query with multiple joins and calculations
  getPerformanceTestData: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.profile_json,
      u.address,
      u.phone_number,
      a.email,
      ur.role,
      ud.division_name,
      logs.total_logs,
      logs.login_count,
      logs.logout_count,
      logs.update_count,
      logs.view_count,
      logs.export_count,
      EXTRACT(EPOCH FROM (NOW() - u.created_at)) / 86400 as days_since_created,
      EXTRACT(EPOCH FROM (NOW() - u.updated_at)) / 86400 as days_since_updated,
      LENGTH(u.long_bio) as long_bio_length,
      LENGTH(u.bio) as bio_length,
      LENGTH(u.address) as address_length,
      CASE 
        WHEN u.profile_json IS NOT NULL THEN
          CASE 
            WHEN u.profile_json->>'social_media' IS NOT NULL THEN
              CASE 
                WHEN u.profile_json->'social_media'->>'instagram' IS NOT NULL THEN
                  LENGTH(u.profile_json->'social_media'->>'instagram')
                ELSE 0
              END
            ELSE 0
          END
        ELSE 0
      END as instagram_length,
      CASE 
        WHEN u.bio IS NOT NULL AND u.address IS NOT NULL AND u.phone_number IS NOT NULL THEN 100
        WHEN u.bio IS NOT NULL AND u.address IS NOT NULL THEN 75
        WHEN u.bio IS NOT NULL OR u.address IS NOT NULL OR u.phone_number IS NOT NULL THEN 50
        ELSE 0
      END as profile_completeness,
      CASE 
        WHEN logs.total_logs > 50 THEN 'Very Active'
        WHEN logs.total_logs > 20 THEN 'Active'
        WHEN logs.total_logs > 5 THEN 'Moderate'
        ELSE 'Inactive'
      END as activity_level
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE action = 'login') as login_count,
        COUNT(*) FILTER (WHERE action = 'logout') as logout_count,
        COUNT(*) FILTER (WHERE action = 'update_profile') as update_count,
        COUNT(*) FILTER (WHERE action = 'view_users') as view_count,
        COUNT(*) FILTER (WHERE action = 'export_data') as export_count
      FROM user_logs
      GROUP BY user_id
    ) logs ON logs.user_id = u.id
    CROSS JOIN (SELECT 1 as dummy) d
    ORDER BY u.created_at DESC
  `,}

// Bad practice: Nested if-else logic for data processing
export const processUserDataWithNestedLogic = (user: any) => {
  let result = {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    processedData: {} as any,
  };

  // Bad practice: deeply nested if-else statements
  if (!user.bio) {
    result.processedData.bioStatus = "missing";
    result.processedData.bioQuality = "no_data";
  } else if (user.bio.length < 10) {
    result.processedData.bioStatus = "short";
    result.processedData.bioQuality = user.bio.includes("test") ? "test_data" : "valid_short";
  } else if (user.bio.length < 50) {
    result.processedData.bioStatus = "medium";
    result.processedData.bioQuality = user.bio.includes("demo") ? "demo_data" : "valid_medium";
  } else {
    result.processedData.bioStatus = "long";
    result.processedData.bioQuality = user.bio.includes("example") ? "example_data" : "valid_long";
  }
  // IMPROVED: Use switch-case or a simpler structure for better readability

  if (user.phone_number) {
    if (user.phone_number.startsWith("+62")) {
      if (user.phone_number.length >= 10 && user.phone_number.length <= 15) {
        result.processedData.phoneStatus = "valid";
        result.processedData.phoneQuality = "good_format";
      } else {
        result.processedData.phoneStatus = "invalid_length";
        result.processedData.phoneQuality = "bad_format";
      }
    } else {
      result.processedData.phoneStatus = "invalid_country_code";
      result.processedData.phoneQuality = "wrong_format";
    }
  } else {
    result.processedData.phoneStatus = "missing";
    result.processedData.phoneQuality = "no_data";
  }

  if (user.address) {
    if (user.address.length < 10) {
      result.processedData.addressStatus = "too_short";
      result.processedData.addressQuality = "incomplete";
    } else if (
      user.address.includes("Jakarta") ||
      user.address.includes("Bandung")
    ) {
      result.processedData.addressStatus = "valid";
      result.processedData.addressQuality = "major_city";
    } else {
      result.processedData.addressStatus = "valid";
      result.processedData.addressQuality = "other_city";
    }
  } else {
    result.processedData.addressStatus = "missing";
    result.processedData.addressQuality = "no_data";
  }

  if (user.profile_json) {
    try {
      const profile = JSON.parse(user.profile_json);
      if (profile.social_media) {
        if (profile.social_media.instagram) {
          result.processedData.profileStatus = "complete";
          result.processedData.profileQuality = "has_social";
        } else {
          result.processedData.profileStatus = "partial";
          result.processedData.profileQuality = "no_instagram";
        }
      } else {
        result.processedData.profileStatus = "incomplete";
        result.processedData.profileQuality = "no_social";
      }
    } catch (error) {
      result.processedData.profileStatus = "invalid_json";
      result.processedData.profileQuality = "parse_error";
    }
  } else {
    result.processedData.profileStatus = "missing";
    result.processedData.profileQuality = "no_data";
  }

  return result;
};
