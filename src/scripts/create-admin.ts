
import dotenv from "dotenv";
import path from "path";


dotenv.config({ path: path.resolve(process.cwd(), ".env") });

console.log("🔍 Vérification des variables d'environnement...");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Définie" : "❌ Non définie");

if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI n'est pas définie dans .env");
  process.exit(1);
}

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function createAdmin() {
  try {
    console.log("🔄 Connexion à MongoDB...");
    
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ Connecté à MongoDB");

    const existingAdmin = await User.findOne({ email: "adminimukwege01@gmail.com" });
    
    if (existingAdmin) {
      console.log("ℹ️ Admin existe déjà:", existingAdmin.email);
      console.log("👤 Role:", existingAdmin.role);
      
      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare("Revelation2025", existingAdmin.password);
      console.log("🔑 Mot de passe valide:", isMatch ? "✅ Oui" : "❌ Non");
      
      if (!isMatch) {
        console.log("🔄 Mise à jour du mot de passe...");
        const hashedPassword = await bcrypt.hash("Revelation2025", 10);
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log("✅ Mot de passe mis à jour!");
      }
      
      await mongoose.disconnect();
      return;
    }

   
    console.log("🔐 Création du mot de passe hashé...");
    const hashedPassword = await bcrypt.hash("Revelation2025", 10);

    console.log("👤 Création de l'utilisateur admin...");
    const admin = await User.create({
      name: "Admin",
      email: "adminimukwege01@gmail.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin créé avec succès!");
    console.log("📧 Email: adminimukwege01@gmail.com");
    console.log("🔑 Mot de passe: Revelation2025");
    console.log("👤 Role:", admin.role);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Erreur:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();