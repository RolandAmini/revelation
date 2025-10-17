import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/utils/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { secret, newPassword } = await request.json();
    
    // 🔒 Protection avec le JWT_SECRET
    if (secret !== process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await connectDB();
    console.log("✅ MongoDB connecté");

    const email = "adminimukwege01@gmail.com";
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("🔐 Nouveau hash généré:", hashedPassword.substring(0, 20) + "...");

    // Mettre à jour l'utilisateur
    const user = await User.findOneAndUpdate(
      { email },
      {
        name: "Admin",
        email,
        password: hashedPassword,
        role: "admin",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Admin mis à jour:", { 
      id: user._id,
      email: user.email, 
      role: user.role 
    });

    // Test de vérification immédiate
    const testMatch = await bcrypt.compare(newPassword, hashedPassword);
    console.log("🧪 Test de vérification:", testMatch ? "✅ OK" : "❌ ERREUR");

    return NextResponse.json({
      success: true,
      message: "Admin réinitialisé avec succès",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      verification: testMatch
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(error) },
      { status: 500 }
    );
  }
}