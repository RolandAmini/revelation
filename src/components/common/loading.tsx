import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingSpinner({ className = "" }) {
  return (
    <div
      className={`animate-spin rounded-full h-6 w-6 border-b-2 border-primary ${className}`}
    />
  );
}

export function LoadingCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="loading-shimmer h-4 rounded w-3/4" />
          <div className="loading-shimmer h-4 rounded w-1/2" />
          <div className="loading-shimmer h-4 rounded w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function LoadingTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="loading-shimmer h-4 rounded w-1/4" />
          <div className="loading-shimmer h-4 rounded w-1/6" />
          <div className="loading-shimmer h-4 rounded w-1/6" />
          <div className="loading-shimmer h-4 rounded w-1/4" />
          <div className="loading-shimmer h-4 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}
