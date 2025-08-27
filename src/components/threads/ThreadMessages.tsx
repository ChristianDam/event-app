import {
  ChatBubbleIcon,
  DotsVerticalIcon,
  Pencil1Icon,
  PersonIcon,
  Share1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ThreadMessagesProps {
  threadId: Id<"threads">;
}

interface MessageProps {
  message: {
    _id: Id<"threadMessages">;
    authorId?: Id<"users">;
    content: string;
    messageType: "text" | "system" | "ai";
    createdAt: number;
    editedAt?: number;
    authorName?: string;
    replies: Array<{
      _id: Id<"threadMessages">;
      authorId?: Id<"users">;
      content: string;
      messageType: "text" | "system" | "ai";
      createdAt: number;
      authorName?: string;
    }>;
  };
  currentUserId?: Id<"users">;
  onReply: (messageId: Id<"threadMessages">) => void;
  onEdit: (messageId: Id<"threadMessages">, content: string) => void;
  onDelete: (messageId: Id<"threadMessages">) => void;
}

function ThreadMessage({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: MessageProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isOwnMessage = message.authorId === currentUserId;
  const canEdit = isOwnMessage && message.messageType === "text";
  const canDelete = isOwnMessage || message.messageType === "text"; // Admins can delete any message

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleString();
    }
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const getAuthorDisplay = (
    msg: typeof message | (typeof message.replies)[0]
  ) => {
    if (msg.messageType === "system") {
      return "System";
    } else if (msg.messageType === "ai") {
      return "AI Assistant";
    } else {
      return msg.authorName || "Anonymous";
    }
  };

  const getMessageTypeColor = (type: "text" | "system" | "ai") => {
    switch (type) {
      case "system":
        return "bg-muted/50 text-muted-foreground border-border";
      case "ai":
        return "bg-accent/50 text-accent-foreground border-border";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "group relative p-4 border-b last:border-b-0",
        message.messageType !== "text" &&
          getMessageTypeColor(message.messageType)
      )}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {message.messageType === "system" ? (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ChatBubbleIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : message.messageType === "ai" ? (
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <PersonIcon className="h-4 w-4 text-accent-foreground" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {getAuthorDisplay(message).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">
              {getAuthorDisplay(message)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            {message.editedAt && (
              <Badge variant="secondary" className="text-xs">
                edited
              </Badge>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-md resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}

          {/* Replies */}
          {message.replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.replies.map((reply) => (
                <div
                  key={reply._id}
                  className="flex items-start space-x-2 pl-4 border-l-2 border-muted"
                >
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs">
                    {getAuthorDisplay(reply).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-xs">
                        {getAuthorDisplay(reply)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(reply.createdAt)}
                      </span>
                    </div>
                    <div className="text-xs whitespace-pre-wrap break-words">
                      {reply.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        {message.messageType === "text" && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setShowMenu(!showMenu)}
            >
              <DotsVerticalIcon className="h-4 w-4" />
            </Button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-lg z-10 min-w-32">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left px-3 py-2"
                  onClick={() => {
                    onReply(message._id);
                    setShowMenu(false);
                  }}
                >
                  <Share1Icon className="h-3 w-3 mr-2" />
                  Reply
                </Button>

                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left px-3 py-2"
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                  >
                    <Pencil1Icon className="h-3 w-3 mr-2" />
                    Edit
                  </Button>
                )}

                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left px-3 py-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to delete this message?")
                      ) {
                        onDelete(message._id);
                      }
                      setShowMenu(false);
                    }}
                  >
                    <TrashIcon className="h-3 w-3 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-5" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}

export function ThreadMessages({ threadId }: ThreadMessagesProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const user = useQuery(api.users.viewer);
  const userId = user?._id;

  const messages = useQuery(api.messages.getThreadMessages, {
    threadId,
    paginationOpts: { numItems: 50, cursor },
  });

  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const markAsRead = useMutation(api.threads.markThreadAsRead);

  // Auto-scroll to bottom and mark as read when new messages arrive
  useEffect(() => {
    if (messagesRef.current && messages?.page) {
      const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        messagesRef.current.scrollTo({
          top: messagesRef.current.scrollHeight,
          behavior: "smooth",
        });
      }

      // Mark thread as read when viewing messages
      markAsRead({ threadId }).catch(console.error);
    }
  }, [messages?.page, threadId, markAsRead]);

  const handleReply = (messageId: Id<"threadMessages">) => {
    // This would trigger the message input to show in reply mode
    // For now, we'll just log it
    console.log("Reply to message:", messageId);
  };

  const handleEdit = async (
    messageId: Id<"threadMessages">,
    content: string
  ) => {
    try {
      await editMessage({ messageId, content });
    } catch (error) {
      console.error("Failed to edit message:", error);
      alert("Failed to edit message. Please try again.");
    }
  };

  const handleDelete = async (messageId: Id<"threadMessages">) => {
    try {
      await deleteMessage({ messageId });
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  if (messages === undefined) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            Loading messages...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-96">
      {/* Messages Container */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto border rounded-lg bg-background"
      >
        {/* Load More Messages */}
        {!messages.isDone && (
          <div className="text-center p-4 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(messages.continueCursor)}
            >
              Load Previous Messages
            </Button>
          </div>
        )}

        {/* Messages */}
        {messages.page.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div>
              <ChatBubbleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.page.map((message) => (
              <ThreadMessage
                key={message._id}
                message={message}
                currentUserId={userId}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
