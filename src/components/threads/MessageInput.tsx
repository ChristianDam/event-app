import { useState, useRef, KeyboardEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PaperPlaneIcon, 
  Cross1Icon 
} from "@radix-ui/react-icons";
import { toast } from 'sonner';

interface MessageInputProps {
  threadId: Id<"threads">;
  replyToId?: Id<"threadMessages">;
  onCancelReply?: () => void;
  placeholder?: string;
}

export function MessageInput({ 
  threadId, 
  replyToId, 
  onCancelReply,
  placeholder = "Type your message..."
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const sendMessage = useMutation(api.messages.sendMessage);

  const handleSend = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        threadId,
        content: trimmedContent,
        replyToId,
      });
      
      setContent("");
      if (onCancelReply) {
        onCancelReply();
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error('Failed to send message', {
        description: 'Please check your connection and try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {replyToId && (
          <div className="flex items-center justify-between mb-2 p-2 bg-muted rounded text-sm">
            <span className="text-muted-foreground">Replying to message</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <Cross1Icon className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSending}
            className="flex-1 resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          <Button
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            size="sm"
            className="px-3 self-end"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <PaperPlaneIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{content.length}/2000</span>
        </div>
      </CardContent>
    </Card>
  );
}