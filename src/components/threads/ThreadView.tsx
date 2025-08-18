import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { ThreadList } from "./ThreadList";
import { ThreadMessages } from "./ThreadMessages";
import { MessageInput } from "./MessageInput";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

interface ThreadViewProps {
  teamId: Id<"teams">;
}

export function ThreadView({ teamId }: ThreadViewProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<Id<"threads"> | undefined>(undefined);
  const [replyToId, setReplyToId] = useState<Id<"threadMessages"> | undefined>();

  const handleThreadSelect = (threadId: Id<"threads">) => {
    setSelectedThreadId(threadId);
    setReplyToId(undefined); // Clear any reply state when switching threads
  };

  const handleCancelReply = () => {
    setReplyToId(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thread List - Left Side */}
        <div className="lg:col-span-1">
          <ThreadList 
            teamId={teamId} 
            onThreadSelect={handleThreadSelect}
            selectedThreadId={selectedThreadId}
          />
        </div>

        {/* Thread Messages and Input - Right Side */}
        <div className="lg:col-span-2">
          {selectedThreadId ? (
            <div className="space-y-4">
              {/* Messages */}
              <ThreadMessages threadId={selectedThreadId} />
              
              {/* Message Input */}
              <MessageInput 
                threadId={selectedThreadId}
                replyToId={replyToId}
                onCancelReply={handleCancelReply}
              />
            </div>
          ) : (
            // No thread selected placeholder
            <Card className="h-96">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ChatBubbleIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <CardTitle className="mb-2">Select a thread to start chatting</CardTitle>
                  <CardDescription>
                    Choose a discussion thread from the list to view messages and join the conversation.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}