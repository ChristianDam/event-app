import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChatBubbleIcon, 
  PlusIcon,
  ClockIcon 
} from "@radix-ui/react-icons";

interface ThreadListProps {
  teamId: Id<"teams">;
  onThreadSelect: (threadId: Id<"threads">) => void;
  selectedThreadId?: Id<"threads">;
}

export function ThreadList({ teamId, onThreadSelect, selectedThreadId }: ThreadListProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  
  const threads = useQuery(api.threads.getThreadsForTeam, { 
    teamId,
    paginationOpts: { numItems: 20, cursor }
  });

  const createThread = useMutation(api.threads.createTeamThread);

  const handleCreateThread = async () => {
    const title = prompt("Enter thread title:");
    if (!title?.trim()) return;
    
    const description = prompt("Enter thread description (optional):");
    
    try {
      const threadId = await createThread({
        teamId,
        title: title.trim(),
        description: description?.trim() || undefined,
      });
      onThreadSelect(threadId);
    } catch (error) {
      console.error("Failed to create thread:", error);
      alert("Failed to create thread. Please try again.");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (threads === undefined) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading threads...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Discussion Threads</h3>
          <p className="text-sm text-muted-foreground">
            {threads.page.length} thread{threads.page.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleCreateThread} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          New Thread
        </Button>
      </div>

      {/* Thread List */}
      <div className="space-y-2">
        {threads.page.map((thread) => (
          <Card 
            key={thread._id}
            className={`cursor-pointer transition-colors hover:bg-accent/50 ${
              selectedThreadId === thread._id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onThreadSelect(thread._id)}
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <ChatBubbleIcon className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium truncate">{thread.title}</h4>
                      {thread.threadType === "ai" && (
                        <Badge variant="secondary" className="text-xs">AI</Badge>
                      )}
                      {thread.unreadCount > 0 && (
                        <Badge className="text-xs px-2 py-0.5 bg-primary text-primary-foreground">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    {thread.description && (
                      <p className="text-sm text-muted-foreground truncate mb-1">
                        {thread.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <ChatBubbleIcon className="h-3 w-3 mr-1" />
                        {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                      </div>
                      
                      {thread.lastMessageAt && (
                        <div className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {formatDate(thread.lastMessageAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {threads.page.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <ChatBubbleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="text-muted-foreground mb-4">
                No threads yet. Start the conversation!
              </div>
              <Button onClick={handleCreateThread}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create First Thread
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More Button */}
        {!threads.isDone && (
          <div className="text-center py-4">
            <Button 
              variant="outline" 
              onClick={() => setCursor(threads.continueCursor)}
              size="sm"
            >
              Load More Threads
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}