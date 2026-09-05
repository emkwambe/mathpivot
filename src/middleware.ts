import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/reset-password",
  "/update-password",
  "/auth/callback",
  "/auth/confirm",
  "/get-started",
  "/pricing",
  "/summer",
  "/about",
  "/careers",
  "/diagnostic",
  "/diagnostic/math1-print",
  "/flyer",
  "/share",
  "/for",
  "/partnerships",
  "/compare",
  "/enroll",
  "/coach-apply",
  "/coaches",
];

const ROLE_PREFIXES: Record<string, string> = {
  super_admin: "/admin",
  admin: "/admin",
  tutor: "/tutor",
  parent: "/parent",
  student: "/student",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const isPublic = PUBLIC_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r),
  );

  // Unauthenticated — send to login (except public routes)
  if (!user) {
    if (isPublic) return supabaseResponse;
    const url = new URL("/login", request.url);
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Landing page, pricing, get-started — let authenticated users through too
  if (
    pathname === "/" ||
    pathname === "/get-started" ||
    pathname === "/pricing"
  ) {
    return supabaseResponse;
  }

  // Fetch profile once for all subsequent checks
  const { data: profile } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;

  // Authenticated on auth routes (login/signup) — redirect to dashboard
  if (isPublic) {
    const dest = ROLE_PREFIXES[role ?? "student"] ?? "/student";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // No profile yet — send to signup to complete
  if (!role) {
    if (pathname.startsWith("/signup")) return supabaseResponse;
    return NextResponse.redirect(new URL("/signup?complete=true", request.url));
  }

  // Super admin and admin can access everything
  if (role === "super_admin" || role === "admin") return supabaseResponse;

  // Check role prefix match
  const allowedPrefix = ROLE_PREFIXES[role];
  const settingsOk =
    pathname.startsWith("/settings") || pathname.startsWith("/messages");

  if (allowedPrefix && (pathname.startsWith(allowedPrefix) || settingsOk)) {
    return supabaseResponse;
  }

  // Wrong role — redirect to their dashboard
  const dest = ROLE_PREFIXES[role] ?? "/student";
  return NextResponse.redirect(new URL(dest, request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
