import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const cookies = request.cookies;
  const accessToken = cookies.get("accessToken")?.value;
  const refreshToken = cookies.get("refreshToken")?.value;
  const isAuthenticated = !!accessToken || !!refreshToken;
  const profileSetupPending = cookies.get("profileSetupPending")?.value;

  // Test-specific cookies
  const td = cookies.get("td")?.value;
  const tt = cookies.get("tt")?.value;
  const isInstructionsShown = cookies.get("isInstructionsShown")?.value;
  const int_sessionId = cookies.get("sessionID")?.value;

  if (
    pathname === "/job-seekerDashboard/interviewPreparation/interview" &&
    !int_sessionId
  ) {
    return NextResponse.redirect(
      new URL("/job-seekerDashboard/interviewPreparation", request.url)
    );
  }

  let response = NextResponse.next();
  let role = null;
  let shouldRefresh = false;

  // 1. Protect /test/submit and /test/verifyIdentity
  if (
    pathname.startsWith("/job-seekerDashboard/test/verifyIdentity") ||
    pathname.startsWith("/job-seekerDashboard/test/testEnvironment")
  ) {
    if (!td) {
      return NextResponse.redirect(
        new URL("/job-seekerDashboard/test", request.url)
      );
    }
  }

  if (
    pathname === "/job-seekerDashboard/test/testEnvironment" &&
    !cookies.get("t_id")?.value
  ) {
    return NextResponse.redirect(new URL("/job-seekerDashboard/test"));
  }

  if (accessToken && !refreshToken) {
    if (
      pathname.startsWith("/job-seekerDashboard") ||
      pathname.startsWith("/recruiterDashboard")
    ) {
      response.cookies.delete("accessToken");
      return NextResponse.redirect(new URL("/login/job-seeker", request.url));
    }
  }

  //role get logic
  if (accessToken && refreshToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.ACCESS_SECRET_KEY)
      );
      role = payload.role;
    } catch (err) {
      // ❌ Access token invalid or expired
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 3. Block unauthenticated access to protected routes
  if (!refreshToken && !accessToken) {
    if (pathname.startsWith("/job-seekerDashboard")) {
      return NextResponse.redirect(new URL("/login/job-seeker", request.url));
    }
    if (pathname.startsWith("/recruiterDashboard")) {
      return NextResponse.redirect(new URL("/login/recruiter", request.url));
    }
    if (pathname.startsWith("/interviews")) {
      return NextResponse.redirect(new URL("/login/job-seeker", request.url));
    }
    return response;
  }

  // 4. ROLE-BASED ACCESS ENFORCEMENT - NO CROSSING THE STREAMS
  if (role) {
    // BLOCK job-seekers from recruiter routes
    if (
      role === "job-seeker" &&
      (pathname.startsWith("/recruiterDashboard") ||
        pathname.startsWith("/register/recruiter") ||
        pathname.startsWith("/login/recruiter"))
    ) {
      return NextResponse.redirect(
        new URL("/job-seekerDashboard", request.url)
      );
    }

    // BLOCK recruiters from job-seeker routes
    if (
      role === "recruiter" &&
      (pathname.startsWith("/job-seekerDashboard") ||
        pathname.startsWith("/register/job-seeker") ||
        pathname.startsWith("/login/job-seeker"))
    ) {
      return NextResponse.redirect(new URL("/recruiterDashboard", request.url));
    }
  }

  // 5. Profile setup flow - COMPLETE THIS OR DIE TRYING
  if (profileSetupPending && role) {
    const profileSetupPath = `/register/job-seeker/profileSetup`;

    // Allowed paths during profile setup
    const allowedPaths = [profileSetupPath, "/api/upload"];

    // If not on allowed path, FORCE redirect to profile setup
    if (!allowedPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL(profileSetupPath, request.url));
    }
    return response;
  }

  if (profileSetupPending) {
    const profileSetupPathRecruiter = "/register/recruiter/profileSetup";
    const allowedPaths = [profileSetupPathRecruiter, "/api/upload"];
    if (!allowedPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(
        new URL(profileSetupPathRecruiter, request.url)
      );
    }
    return response;
  }

  // 6. Redirect authenticated users away from auth pages
  if (
    refreshToken &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(
      new URL(
        role === "recruiter" ? "/recruiterDashboard" : "/job-seekerDashboard",
        request.url
      )
    );
  }
  return response;
}

export const config = {
  matcher: [
    "/job-seekerDashboard/:path*",
    "/recruiterDashboard/:path*",
    "/login/:path*",
    "/register/:path*",
    "/test/testEnvironment",
    "/test/submit",
    "/test/verifyIdentity",
    "/test/:path*", // Added this to catch all test routes
  ],
};
