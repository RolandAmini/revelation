"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Après 3 secondes → redirection vers login
    const timer = setTimeout(() => {
      router.push("/admin/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-indigo-900">
      <div className="text-center animate-fadeIn">
        {/* Logo (SVG + texte) */}
        <div className="flex flex-col items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-24 h-24 text-white mb-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.947 8.305a1 1 0 00-.277-1.39l-3.5-2.25a1 1 0 00-1.39.277L14.2 6.8l-2.6-1.7a1 1 0 00-1.39.278L7.68 9.2 4.86 7.33a1 1 0 00-1.39.277l-.75 1.166a1 1 0 00.278 1.39l3.5 2.25a1 1 0 001.39-.278l2.53-3.943 2.6 1.7a1 1 0 001.39-.277L16.32 7.2l2.82 1.868a1 1 0 001.39-.277l.417-.486zM5 16a1 1 0 000 2h14a1 1 0 100-2H5z" />
          </svg>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">
            Revelation Shop
          </h1>
          <p className="text-gray-200 mt-2">
            Spécialiste en pièces de rechange mobiles
          </p>
        </div>
      </div>
    </div>
  );
}
