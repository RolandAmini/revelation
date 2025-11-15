const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, default: "user" },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdmin() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error("⚠️ MONGODB_URI non défini dans .env");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connecté");

    const email = "aminimukwege01@gmail.com";
    const password = "Aminishop2025";

    // Supprimer l'utilisateur existant s'il existe
    await User.deleteOne({ email });
    console.log("🗑️ Ancien utilisateur supprimé (si existant)");

    // Créer un nouveau hash
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Nouveau hash créé");

    // Créer l'admin
    const admin = await User.create({
      name: "Admin Principal",
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("\n✅ ========================================");
    console.log("✅ ADMINISTRATEUR CRÉÉ AVEC SUCCÈS !");
    console.log("✅ ========================================");
    console.log("📧 Email    :", email);
    console.log("🔑 Password :", password);
    console.log("👤 Rôle     :", admin.role);
    console.log("🆔 ID       :", admin._id);
    console.log("✅ ========================================\n");

    // Vérification immédiate
    const testMatch = await bcrypt.compare(password, hashedPassword);
    console.log("🔍 Test de vérification:", testMatch ? "✅ OK" : "❌ ERREUR");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERREUR:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();