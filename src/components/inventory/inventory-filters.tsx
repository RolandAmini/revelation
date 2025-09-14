"use client";

import React from "react";
import { Search, Filter, X, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; // Imported Label for better form semantics

interface InventoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  categories: string[];
  onExport: () => void;
  onImport: () => void;
}

export default function InventoryFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
  categories,
  onExport,
  onImport,
}: InventoryFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (categoryFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    return count;
  }, [searchTerm, categoryFilter, statusFilter]);

  const clearFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onStatusChange("all");
    onSortChange("name_asc"); // Reset sort as well
  };

  const stockStatuses = [
    { value: "all", label: "All Status" },
    { value: "in_stock", label: "In Stock" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
  ];

  const sortOptions = [
    { value: "name_asc", label: "Name A-Z" },
    { value: "name_desc", label: "Name Z-A" },
    { value: "stock_asc", label: "Stock Low-High" },
    { value: "stock_desc", label: "Stock High-Low" },
    { value: "value_asc", label: "Value Low-High" },
    { value: "value_desc", label: "Value High-Low" },
    { value: "updated_desc", label: "Recently Updated" },
    // You had 'profit_desc' but it's not handled in InventoryPage's sort.
    // Ensure InventoryPage can handle it or remove this option.
    // { value: "profit_desc", label: "Most Profitable" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 md:p-6">
          {" "}
          {/* Increased padding for card content */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-grow lg:flex-[2_2_0%]">
              {" "}
              {/* Take more space on larger screens */}
              <Label htmlFor="search-input" className="sr-only">
                Search Items
              </Label>{" "}
              {/* SR only for accessibility */}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => onSearchChange("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Main Filters (Category, Status, Sort) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:flex-[4_4_0%]">
              {" "}
              {/* Responsive grid for selects */}
              {/* Category Filter */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category-select">Category</Label>
                <Select value={categoryFilter} onValueChange={onCategoryChange}>
                  <SelectTrigger id="category-select">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Status Filter */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status-select">Status</Label>
                <Select value={statusFilter} onValueChange={onStatusChange}>
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Sort By */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sort-select">Sort By</Label>
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger id="sort-select">
                    <SelectValue placeholder="Sort items" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions: Toggle Advanced Filters, Export/Import */}
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              {" "}
              {/* Align to end on large screens */}
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onImport}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters & Active Filters Display */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Active Filters
              </h3>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 ? (
              <div className="flex flex-wrap gap-2 pt-4 border-t mt-4 border-gray-200 dark:border-gray-700">
                <span className="text-sm text-muted-foreground">Applied:</span>
                {categoryFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Category: {categoryFilter}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => onCategoryChange("all")}
                    />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Status:{" "}
                    {stockStatuses.find((s) => s.value === statusFilter)
                      ?.label || statusFilter.replace("_", " ")}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => onStatusChange("all")}
                    />
                  </Badge>
                )}
                {searchTerm && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Search: &quot;{searchTerm}&quot;
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => onSearchChange("")}
                    />
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm">
                No active filters applied.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
