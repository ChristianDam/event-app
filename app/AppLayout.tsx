"use client";

import { Authenticated, Unauthenticated, useConvexAuth } from "convex/react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { Footer } from "./components/Footer";
import { LandingPage } from "./components/LandingPage";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Toaster } from "./components/ui/sonner";
import { SignInFormEmailCode } from "./auth/SignInFormEmailCode";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useConvexAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navigate = (to: string) => {
    router.push(to);
  };

  // Check if current route is public (like invitations)
  const isPublicRoute = pathname.startsWith('/invite/') || pathname.startsWith('/events/discover/');

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar navigate={navigate} currentPath={pathname} />
        
        {!isPublicRoute ? (
          // Protected routes with authentication
          <>
            <Authenticated>
              <SidebarInset className="flex flex-col">
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:hidden">
                  <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
                </header>
                <main className="flex-1 overflow-auto">{children}</main>
              </SidebarInset>
            </Authenticated>
            
            <Unauthenticated>
              <main className="flex grow flex-col">
                {pathname === "/" ? (
                  <LandingPage />
                ) : (
                  <SignInFormEmailCode />
                )}
                <Footer />
              </main>
            </Unauthenticated>
          </>
        ) : (
          // Public routes (invitations, public events)
          <main className="flex grow flex-col">
            {children}
            <Footer />
          </main>
        )}
      </div>
      <Toaster />
    </SidebarProvider>
  );
}