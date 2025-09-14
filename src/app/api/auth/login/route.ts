import { NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: Request) {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error(
        "Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables"
      );
      return NextResponse.json(
        { message: "Configuration serveur manquante" },
        { status: 500 }
      );
    }

    const { email, password } = await req.json();

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return NextResponse.json(
        { message: "Connexion réussie", role: "admin" },
        { status: 200 }
      );
    } else {
      console.warn(`Failed admin login attempt for email: ${email}`);
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error("Admin login error:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
