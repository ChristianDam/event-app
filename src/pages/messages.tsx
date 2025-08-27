import { ChatBubbleIcon } from "@radix-ui/react-icons";
import { useQuery } from "convex/react";
import { ThreadView } from "@/components/threads/ThreadView";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../convex/_generated/api";

export default function MessagesPage(): JSX.Element {
  const currentUser = useQuery(api.users.viewer);
  const currentTeam = useQuery(api.users.getCurrentTeam);

  if (currentUser === undefined || currentTeam === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading messages...</div>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <ChatBubbleIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No Team Selected</CardTitle>
              <CardDescription>
                Please select a team to view messages and discussions.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Team discussions and conversations for {currentTeam.name}
        </p>
      </div>

      <ThreadView teamId={currentTeam._id} />
    </div>
  );
}
