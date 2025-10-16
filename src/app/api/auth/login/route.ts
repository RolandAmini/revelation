import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/utils/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log("🟢 Requête reçue :", { email, password });

    if (!email || !password) {
      return NextResponse.json({ message: "Email et mot de passe requis" }, { status: 400 });
    }

    await connectDB();
    console.log("✅ MongoDB connecté");

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ Utilisateur non trouvé :", email);
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Mot de passe incorrect pour :", email);
      return NextResponse.json({ message: "Mot de passe incorrect" }, { status: 401 });
    }

    // Vérifie si le secret JWT existe
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET manquant dans .env !");
      return NextResponse.json({ message: "Problème de configuration du serveur" }, { status: 500 });
    }

    console.log("🔐 Génération du token JWT...");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      message: "Connexion réussie",
      user: { email: user.email, role: user.role },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    console.log(`✅ Connexion réussie : ${email} - Rôle : ${user.role}`);
    return response;

  } catch (error) {
    console.error("❌ ERREUR SERVEUR DÉTAILLÉE :", error);
    const errorMessage = typeof error === "object" && error !== null && "message" in error
      ? (error as { message: string }).message
      : String(error);
    return NextResponse.json({ message: "Erreur interne du serveur", error: errorMessage }, { status: 500 });
  }
}
