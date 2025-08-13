import { Chat } from "@/Chat/Chat";
import { ChatHeader } from "@/Chat/ChatIntro";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface HomePageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function HomePage(_props: HomePageProps) {
  const user = useQuery(api.users.viewer);

  return (
    <>
      <ChatHeader />
      {/* eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain */}
      <Chat viewer={user?._id!} />
    </>
  );
}