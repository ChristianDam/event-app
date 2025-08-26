import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ThreadMessages } from "./ThreadMessages";
import { MessageInput } from "./MessageInput";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { ChatBubbleIcon } from "@radix-ui/react-icons";

interface EventThreadViewProps {
  eventId: Id<"events">;
}

export function EventThreadView({ eventId }: EventThreadViewProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<Id<"threads"> | undefined>(undefined);
  const [replyToId, setReplyToId] = useState<Id<"threadMessages"> | undefined>();
  
  // Get event data and threads for this event
  const event = useQuery(api.events.getEvent, { eventId });
  const threads = useQuery(api.threads.getThreadsForEvent, { 
    eventId,
    paginationOpts: { numItems: 20, cursor: null }
  });

  // Auto-select the first thread when threads load (events typically have one discussion thread)
  useEffect(() => {
    if (threads && threads.page.length > 0 && selectedThreadId === undefined) {
      // Use the first event thread (should be the main discussion thread)
      setSelectedThreadId(threads.page[0]._id);
    }
  }, [threads, selectedThreadId]);

  const handleCancelReply = () => {
    setReplyToId(undefined);
  };

  if (threads === undefined || event === undefined) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // If no threads exist, show a message
  if (threads.page.length === 0) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <ChatBubbleIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Discussion Yet</CardTitle>
            <CardDescription>
              The event discussion thread will appear here once it's created.
            </CardDescription>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Event Thread Title */}
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold">
          {threads.page.find(t => t._id === selectedThreadId)?.title || 'Event Discussion'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Coordinate with attendees and organizers about this event
        </p>
      </div>

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
        <Card className="h-96">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <ChatBubbleIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Loading Discussion</CardTitle>
              <CardDescription>
                Setting up the event discussion thread...
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}