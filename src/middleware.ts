import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Basic in-memory rate limiting (for demonstration)
const ipCache = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 100; // requests
const WINDOW_MS = 60 * 1000; // 1 minute

export default withAuth(
  function middleware(req) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? (req as any).ip ?? "127.0.0.1";
    const now = Date.now();

    // Prevent memory leaks: prune expired items or perform emergency clear
    if (ipCache.size > 2000) {
      for (const [key, data] of ipCache.entries()) {
        if (now - data.lastReset > WINDOW_MS) {
          ipCache.delete(key);
        }
      }
      // Emergency size cap
      if (ipCache.size > 2000) {
        ipCache.clear();
      }
    }

    const userData = ipCache.get(ip) ?? { count: 0, lastReset: now };

    if (now - userData.lastReset > WINDOW_MS) {
      userData.count = 0;
      userData.lastReset = now;
    }

    userData.count++;
    ipCache.set(ip, userData);

    if (userData.count > RATE_LIMIT) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    const token = req.nextauth.token;
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

    if (isAdminPage && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
