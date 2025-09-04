"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { InventoryItem, StockTransaction } from "@/lib/types/inventory";

interface ReceiptData {
  type: "sale" | "purchase" | "inventory_report";
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  receiptNumber: string;
  date: string;
}

interface ReceiptGeneratorProps {
  data: ReceiptData;
  onClose: () => void;
}

export default function ReceiptGenerator({
  data,
  onClose,
}: ReceiptGeneratorProps) {
  const printReceipt = () => {
    window.print();
  };

  const downloadPDF = () => {
    // Convert receipt to PDF and download
    const receiptContent = document.getElementById("receipt-content");
    if (receiptContent) {
      // Simple PDF generation (you might want to use a library like jsPDF)
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt ${data.receiptNumber}</title>
              <style>
                body { font-family: monospace; margin: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .center { text-align: center; }
                .right { text-align: right; }
                .line { border-top: 1px dashed #000; margin: 10px 0; }
                .header { font-weight: bold; font-size: 18px; }
                .item-row { display: flex; justify-content: space-between; }
                .total-row { font-weight: bold; font-size: 16px; }
              </style>
            </head>
            <body>
              ${receiptContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Receipt Content */}
        <div id="receipt-content" className="p-6">
          <div className="font-mono text-sm">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-lg font-bold">INVENTORYPRO</h1>
              <p className="text-xs text-gray-600">
                Professional Inventory System
              </p>
              <div className="border-t border-dashed border-gray-400 my-2"></div>
            </div>

            {/* Receipt Info */}
            <div className="mb-4">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{data.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{data.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="capitalize">
                  {data.type.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            {data.customerInfo && (
              <div className="mb-4">
                <div className="border-t border-dashed border-gray-400 my-2"></div>
                <div className="text-xs text-gray-600">
                  CUSTOMER INFORMATION
                </div>
                {data.customerInfo.name && (
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span>{data.customerInfo.name}</span>
                  </div>
                )}
                {data.customerInfo.phone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{data.customerInfo.phone}</span>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Items */}
            <div className="mb-4">
              <div className="text-xs text-gray-600 mb-2">ITEMS</div>
              {data.items.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <span className="truncate pr-2">{item.name}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Totals */}
            <div className="mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(data.subtotal)}</span>
              </div>
              {data.tax && data.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(data.tax)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 my-2"></div>
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2"></div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-600">
              <p>Thank you for your business!</p>
              <p className="mt-2">Generated on {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={printReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
