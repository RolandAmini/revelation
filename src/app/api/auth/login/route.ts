import { NextResponse } from "next/server";

// 🔑 identifiants admin (à déplacer plus tard dans un .env)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // ✅ succès : retour d’une réponse
      return NextResponse.json(
        { message: "Connexion réussie", role: "admin" },
        { status: 200 }
      );
    } else {
      // ❌ identifiants incorrects
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Erreur serveur", error },
      { status: 500 }
    );
  }
}
