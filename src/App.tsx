import { Authenticated, Unauthenticated } from "convex/react";
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { Layout } from "@/Layout";
import { SignInFormEmailCode } from "./auth/SignInFormEmailCode";
import { router } from "./router/routes";

// Router state hook
function useRouter() {
  const [location, setLocation] = useState(() => {
    if (typeof window !== "undefined") {
      return {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      };
    }
    return { pathname: "/", search: "", hash: "" };
  });

  useEffect(() => {
    const handlePopState = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState(null, "", to);
    setLocation({
      pathname: to,
      search: "",
      hash: "",
    });
  };

  return { location, navigate };
}

function AppContent() {
  const { location, navigate } = useRouter();

  // Match current route
  const routeMatch = router.matchRoute(location.pathname);

  const renderContent = () => {
    if (!routeMatch) {
      // 404 page - could be moved to a separate component
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The page you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Go Home
          </button>
        </div>
      );
    }

    const { route, params } = routeMatch;
    const PageComponent = route.component;

    return <PageComponent params={params} navigate={navigate} />;
  };

  // Check if current route requires authentication
  const requiresAuth = routeMatch?.route.authRequired ?? true;

  return (
    <Layout navigate={navigate} currentPath={location.pathname}>
      {!requiresAuth ? (
        // Public pages (like invitations)
        renderContent()
      ) : (
        <>
          <Authenticated>{renderContent()}</Authenticated>
          <Unauthenticated>
            {location.pathname === "/" ? (
              <LandingPage />
            ) : (
              <SignInFormEmailCode />
            )}
          </Unauthenticated>
        </>
      )}
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
