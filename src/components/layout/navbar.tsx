"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  BarChart3,
  History,
  Settings,
  Menu,
  Sun,
  Moon,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onExport: () => void;
  onImport: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Transactions", href: "/transactions", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Navbar({
  sidebarOpen,
  setSidebarOpen,
  darkMode,
  setDarkMode,
  onExport,
  onImport,
}: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and mobile menu button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">InventoryPro</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            title="Export Data"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onImport}
            title="Import Data"
          >
            <Upload className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
