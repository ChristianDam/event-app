"use client";

import { Authenticated, Unauthenticated } from "convex/react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Next.js Migration Test</h1>
      
      <Authenticated>
        <div className="text-green-600">
          ✅ Authenticated - Convex Auth is working!
        </div>
      </Authenticated>
      
      <Unauthenticated>
        <div className="text-blue-600">
          🔑 Not authenticated - Please sign in
        </div>
      </Unauthenticated>
    </div>
  );
}