"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  BarChart3,
  History,
  Settings,
  X,
  TrendingUp,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InventoryStats } from "@/lib/types/inventory";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  stats: InventoryStats;
  className?: string;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Transactions", href: "/transactions", icon: History },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ open, onClose, stats }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b lg:hidden">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="p-4 space-y-4 border-t">
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Total Items
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalItems}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Total Value
                  </span>
                  <Badge variant="default" className="text-xs">
                    ${stats.totalValue.toFixed(0)}
                  </Badge>
                </div>

                {stats.lowStockItems > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {stats.lowStockItems}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Month Profit
                  </span>
                  <Badge
                    variant={
                      stats.monthlyProfit > 0 ? "default" : "destructive"
                    }
                    className="text-xs"
                  >
                    ${Math.abs(stats.monthlyProfit).toFixed(0)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
