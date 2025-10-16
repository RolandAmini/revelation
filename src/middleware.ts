import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes protégées
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("auth_token");

    if (!token) {
      // Pas de token → redirection vers /admin/login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      // Vérification du token
      jwt.verify(
        token.value,
        process.env.JWT_SECRET || "votre_secret_jwt_ultra_securise"
      );

      // Token valide → on continue
      return NextResponse.next();
    } catch (error) {
      console.error("❌ Token invalide :", error);
      // Token invalide → redirection vers /admin/login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Autres routes → passage normal
  return NextResponse.next();
}

// ✅ Important : Exécuter le middleware dans Node.js runtime
export const config = {
  matcher: ["/admin/:path*"],
  runtime: "nodejs",
};
