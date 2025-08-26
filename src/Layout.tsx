import { ReactNode } from "react";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { useConvexAuth } from "convex/react";
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
