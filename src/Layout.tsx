import { useConvexAuth } from "convex/react";
import type { ReactNode } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { Footer } from "./components/Footer";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { Toaster } from "./components/ui/sonner";
export function Layout({
  children,
  navigate,
  currentPath,
}: {
  children: ReactNode;
  navigate?: (to: string) => void;
  currentPath?: string;
}) {
  const { isAuthenticated } = useConvexAuth();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar navigate={navigate} currentPath={currentPath} />
        {isAuthenticated ? (
          <SidebarInset className="flex flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:hidden">
              <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </SidebarInset>
        ) : (
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
