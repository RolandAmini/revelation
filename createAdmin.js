const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

// Schéma User
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "user",
  },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Fonction de connexion MongoDB
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("⚠️ MONGODB_URI non défini dans .env");
  }

  if (mongoose.connection.readyState >= 1) {
    console.log("✅ Déjà connecté à MongoDB");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connecté avec succès");
  } catch (err) {
    console.error("❌ Erreur connexion MongoDB:", err);
    throw err;
  }
}

// Fonction principale
async function createAdmin() {
  try {
    await connectDB();

    const email = "aminimukwege01@gmail.com";
    const password = "Aminishop2025";
    
    console.log("🔍 Recherche de l'utilisateur...");
    
    const existing = await User.findOne({ email });
    
    if (existing) {
      console.log("⚠️ L'utilisateur existe déjà :", email);
      console.log("📋 Rôle actuel :", existing.role);
      
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log("✅ Rôle mis à jour en 'admin'");
      } else {
        console.log("✅ L'utilisateur est déjà admin");
      }
      
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    console.log("🔐 Hachage du mot de passe...");
    const hashed = await bcrypt.hash(password, 10);

    console.log("👤 Création de l'administrateur...");
    const admin = new User({
      name: "Admin Principal",
      email,
      password: hashed,
      role: "admin",
    });

    await admin.save();
    
    console.log("\n✅ ========================================");
    console.log("✅ ADMINISTRATEUR CRÉÉ AVEC SUCCÈS !");
    console.log("✅ ========================================");
    console.log("📧 Email    :", email);
    console.log("🔑 Password :", password);
    console.log("👤 Rôle     :", admin.role);
    console.log("🆔 ID       :", admin._id);
    console.log("✅ ========================================\n");
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ ========================================");
    console.error("❌ ERREUR :");
    console.error("❌ ========================================");
    console.error(error);
    console.error("❌ ========================================\n");
    
    await mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();