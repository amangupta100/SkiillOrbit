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

  // Redirect interview routes if no refresh
  if (!refreshToken && pathname.startsWith("/interviews")) {
    return NextResponse.redirect(new URL("/login/job-seeker", request.url));
  }

  if (
    pathname.startsWith("/register/job-seeker/profileSetup") &&
    !refreshToken
  ) {
    return NextResponse.redirect(new URL("/login/job-seeker", request.url));
  }

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
  let email = null;

  // --- TEST route locks ---
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

  // ------------------------------
  // 1️⃣ Extract ROLE + EMAIL from JWT
  // ------------------------------
  if (accessToken && refreshToken) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(process.env.ACCESS_SECRET_KEY)
      );
      role = payload.role;
      email = payload.email; // ⬅ GET EMAIL FROM JWT
    } catch (err) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ------------------------------
  // 2️⃣ PROTECT /adminDashboard HERE
  // ------------------------------
  // if (pathname.startsWith("/adminDashboard")) {
  //   const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  //   const referer = `${
  //     role === "job-seeker" ? "/job-seekerDashboard" : "/recruiterDashboard"
  //   }`;

  //   // BLOCK non-admins
  //   if (!accessToken || !refreshToken) {
  //     const loginUrl = new URL("/login/job-seeker", request.url);
  //     loginUrl.searchParams.set(
  //       "returnTo",
  //       encodeURIComponent(pathname + request.nextUrl.search)
  //     );
  //     return NextResponse.redirect(loginUrl);
  //   }

  //   // BLOCK wrong role
  //   if (role !== "admin") {
  //     return NextResponse.redirect(new URL(referer, request.url));
  //   }

  //   // BLOCK wrong email
  //   if (email !== ADMIN_EMAIL) {
  //     return NextResponse.redirect(new URL(referer, request.url));
  //   }
  // }

  // --------------------------------------------------------------
  // ⬇ (existing logic unchanged below this point)
  // --------------------------------------------------------------

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

  if (role) {
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

    if (
      role === "recruiter" &&
      (pathname.startsWith("/job-seekerDashboard") ||
        pathname.startsWith("/register/job-seeker") ||
        pathname.startsWith("/login/job-seeker"))
    ) {
      return NextResponse.redirect(new URL("/recruiterDashboard", request.url));
    }
  }

  if (profileSetupPending && role) {
    const profileSetupPath = `/register/job-seeker/profileSetup`;
    const allowedPaths = [profileSetupPath, "/api/upload"];
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
    "/adminDashboard/:path*", // ⬅ ADD THIS
    "/login/:path*",
    "/register/:path*",
    "/test/testEnvironment",
    "/test/submit",
    "/test/verifyIdentity",
    "/test/:path*",
    "/interviews/:path*",
  ],
};
