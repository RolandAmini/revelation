import { NextResponse } from "next/server";
import { connectDB } from "@/utils/mongodb";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ message: "Connexion MongoDB réussie 🚀" });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de se connecter à MongoDB" },
      { status: 500 }
    );
  }
}
