"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to error tracking service if available
    console.error("Katiba360 Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-white">
      <div className="max-w-lg w-full text-center">
        {/* Shield with Alert Badge */}
        <div className="inline-flex items-center justify-center relative mb-6">
          <div className="bg-[#1EB53A]/10 p-6 rounded-full">
            <Shield className="h-16 w-16 text-[#0A7B24]" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#CE1126] text-white p-2 rounded-full shadow-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#374151] mb-3">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-[#6B7280] mb-8 leading-relaxed">
          We encountered an unexpected issue while loading this constitutional resource. 
          Your constitutional rights remain protected, and we are working to restore access.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#1EB53A] hover:bg-[#0A7B24] text-white flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-[#D1D5DB] text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </div>

        {/* Debug Info in Development */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-8 text-left bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto text-xs text-red-600 font-mono max-h-40">
            <strong>Error details:</strong> {error.message}
            {error.digest && <div><strong>Digest:</strong> {error.digest}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
