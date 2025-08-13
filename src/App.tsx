import { Chat } from "@/Chat/Chat";
import { ChatHeader } from "@/Chat/ChatIntro";
import { Layout } from "@/Layout";
import { UserMenu } from "@/components/UserMenu";
import { TeamPage } from "@/components/TeamPage";
import { api } from "../convex/_generated/api";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInFormEmailCode } from "./auth/SignInFormEmailCode";
import { useState, useEffect } from "react";
import { Id } from "../convex/_generated/dataModel";

// Router state hook
function useRouter() {
  const [location, setLocation] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      };
    }
    return { pathname: '/', search: '', hash: '' };
  });

  useEffect(() => {
    const handlePopState = () => {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState(null, '', to);
    setLocation({
      pathname: to,
      search: '',
      hash: '',
    });
  };

  return { location, navigate };
}

function AppContent() {
  const user = useQuery(api.users.viewer);
  const { location, navigate } = useRouter();
  
  const renderContent = () => {
    if (location.pathname === '/') {
      return (
        <>
          <ChatHeader />
          {/* eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain */}
          <Chat viewer={user?._id!} />
        </>
      );
    }
    
    const teamMatch = location.pathname.match(/^\/team\/(.+)$/);
    if (teamMatch) {
      const teamId = teamMatch[1];
      return <TeamPage teamId={teamId as Id<"teams">} navigate={navigate} />;
    }
    
    return (
      <>
        <ChatHeader />
        {/* eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain */}
        <Chat viewer={user?._id!} />
      </>
    );
  };

  return (
    <Layout
      menu={
        <>
          <Authenticated>
            <UserMenu favoriteColor={user?.favoriteColor} navigate={navigate}>
              {user?.name ?? user?.email ?? user?.phone ?? "Anonymous"}
            </UserMenu>
          </Authenticated>
          <Unauthenticated>{null}</Unauthenticated>
        </>
      }
    >
      <>
        <Authenticated>
          {renderContent()}
        </Authenticated>
        <Unauthenticated>
          <SignInFormEmailCode />
        </Unauthenticated>
      </>
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
