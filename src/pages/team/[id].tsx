import { TeamPage } from "@/components/TeamPage";
import { Id } from "../../../convex/_generated/dataModel";

interface TeamIdPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function TeamIdPage({ params, navigate }: TeamIdPageProps) {
  return <TeamPage teamId={params.id as Id<"teams">} navigate={navigate} />;
}