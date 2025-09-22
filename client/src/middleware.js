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
    pathname === "/userDashboard/interviewPreparation/interview" &&
    !int_sessionId
  ) {
    return NextResponse.redirect(
      new URL("/userDashboard/interviewPreparation", request.url)
    );
  }

  let response = NextResponse.next();
  let role = null;
  let shouldRefresh = false;

  // 1. Protect /test/submit and /test/verifyIdentity
  if (
    pathname.startsWith("/userDashboard/test/verifyIdentity") ||
    pathname.startsWith("/userDashboard/test/testEnvironment")
  ) {
    if (!td) {
      return NextResponse.redirect(new URL("/userDashboard/test", request.url));
    }
  }

  if (accessToken && !refreshToken) {
    if (
      pathname.startsWith("/userDashboard") ||
      pathname.startsWith("/recruiterDashboard")
    ) {
      response.cookies.delete("accessToken");
      return NextResponse.redirect(new URL("/login/job-seeker", request.url));
    }
  }

  // 1. Token verification and refresh logic
  if (refreshToken && !accessToken) {
    shouldRefresh = true;
  } else if (accessToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.ACCESS_SECRET_KEY)
      );
      role = payload.role;
    } catch (error) {
      if (error.code === "ERR_JWT_EXPIRED" && refreshToken) {
        shouldRefresh = true;
      }
    }
  }

  if (shouldRefresh) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/common/auth/refreshToken`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return NextResponse.redirect(new URL("/login/job-seeker", request.url));
      }

      const data = await res.json();
      role = data?.res?.role;
    } catch (error) {
      console.error("Refresh token failed:", error);
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return NextResponse.redirect(new URL("/login/job-seeker", request.url));
    }
  }

  // 3. Block unauthenticated access to protected routes
  if (!isAuthenticated) {
    if (pathname.startsWith("/userDashboard")) {
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
      return NextResponse.redirect(new URL("/userDashboard", request.url));
    }

    // BLOCK recruiters from job-seeker routes
    if (
      role === "recruiter" &&
      (pathname.startsWith("/userDashboard") ||
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
    role &&
    (pathname.startsWith("/login") || pathname.startsWith("/register"))
  ) {
    return NextResponse.redirect(
      new URL(
        role === "recruiter" ? "/recruiterDashboard" : "/userDashboard",
        request.url
      )
    );
  }
  return response;
}

export const config = {
  matcher: [
    "/userDashboard/:path*",
    "/recruiterDashboard/:path*",
    "/login/:path*",
    "/register/:path*",
    "/test/testEnvironment",
    "/test/submit",
    "/test/verifyIdentity",
    "/test/:path*", // Added this to catch all test routes
  ],
};
