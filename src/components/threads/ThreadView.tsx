import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
  
  // Get first page of threads to find the latest one
  const threads = useQuery(api.threads.getThreadsForTeam, { 
    teamId,
    paginationOpts: { numItems: 20, cursor: null }
  });

  // Auto-select the latest active thread when threads load and no thread is selected
  useEffect(() => {
    if (threads && threads.page.length > 0 && selectedThreadId === undefined) {
      // Find the thread with the most recent activity (lastMessageAt or createdAt)
      const mostActiveThread = threads.page.reduce((latest, current) => {
        const latestTime = latest.lastMessageAt || latest.createdAt;
        const currentTime = current.lastMessageAt || current.createdAt;
        return currentTime > latestTime ? current : latest;
      });
      setSelectedThreadId(mostActiveThread._id);
    }
  }, [threads, selectedThreadId]);

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