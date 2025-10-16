import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {connectDB} from "@/utils/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validation des champs
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    await connectDB();

    // Recherche de l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérification du mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Vérification du rôle admin
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Accès refusé. Vous n'êtes pas administrateur." },
        { status: 403 }
      );
    }

    // Génération du token JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || "votre_secret_jwt_ultra_securise",
      { expiresIn: "7d" }
    );

    console.log("✅ Connexion réussie :", user.email, "- Rôle :", user.role);

    // Création de la réponse avec cookie
    const response = NextResponse.json(
      {
        success: true,
        role: user.role,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 200 }
    );

    // Ajout du cookie sécurisé
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: "/"
    });

    return response;

  } catch (error) {
    console.error("❌ Erreur login :", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}