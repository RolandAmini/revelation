import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "user",
  },
});

// Empêche la recréation du modèle à chaque rechargement (utile avec Next.js)
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
