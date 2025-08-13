import { InvitePage } from "@/components/InvitePage";

interface InviteTokenPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function InviteTokenPage({ params, navigate }: InviteTokenPageProps) {
  return <InvitePage token={params.token} navigate={navigate} />;
}