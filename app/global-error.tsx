"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Katiba360 Critical Root Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex p-4 bg-red-50 text-[#CE1126] rounded-full mb-4">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-[#0A7B24] mb-2">
            Katiba360 System Error
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            A critical error occurred while initializing the application. Please reload or try again.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1EB53A] hover:bg-[#0A7B24] text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Katiba360
          </button>
        </div>
      </body>
    </html>
  );
}
