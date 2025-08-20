import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireAuth } from "./lib/auth";

// Thread Message Functions

export const getThreadMessages = query({
  args: {
    threadId: v.id("threads"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("threadMessages"),
      threadId: v.id("threads"),
      authorId: v.optional(v.id("users")),
      content: v.string(),
      messageType: v.union(v.literal("text"), v.literal("system"), v.literal("ai")),
      replyToId: v.optional(v.id("threadMessages")),
      editedAt: v.optional(v.number()),
      createdAt: v.number(),
      authorName: v.optional(v.string()),
      authorEmail: v.optional(v.string()),
      replies: v.array(v.object({
        _id: v.id("threadMessages"),
        authorId: v.optional(v.id("users")),
        content: v.string(),
        messageType: v.union(v.literal("text"), v.literal("system"), v.literal("ai")),
        createdAt: v.number(),
        authorName: v.optional(v.string()),
      })),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify user is a participant in the thread
    const participation = await ctx.db
      .query("threadParticipants")
      .withIndex("by_thread_and_user", (q) => q.eq("threadId", args.threadId).eq("userId", user._id))
      .unique();

    if (!participation) {
      throw new Error("Not a participant in this thread");
    }

    // Get paginated messages (excluding replies, we'll fetch those separately)
    const result = await ctx.db
      .query("threadMessages")
      .withIndex("by_thread_and_created", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("replyToId"), undefined))
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedMessages = await Promise.all(
      result.page.map(async (message) => {
        let authorName: string | undefined;
        let authorEmail: string | undefined;

        if (message.authorId) {
          const author = await ctx.db.get(message.authorId);
          if (author) {
            authorName = author.name ?? author.email ?? author.phone ?? "Anonymous";
            authorEmail = author.email;
          }
        } else if (message.messageType === "ai") {
          authorName = "AI Assistant";
        } else if (message.messageType === "system") {
          authorName = "System";
        }

        // Get replies to this message
        const replies = await ctx.db
          .query("threadMessages")
          .withIndex("by_reply_to", (q) => q.eq("replyToId", message._id))
          .order("asc")
          .collect();

        const enrichedReplies = await Promise.all(
          replies.map(async (reply) => {
            let replyAuthorName: string | undefined;

            if (reply.authorId) {
              const replyAuthor = await ctx.db.get(reply.authorId);
              if (replyAuthor) {
                replyAuthorName = replyAuthor.name ?? replyAuthor.email ?? replyAuthor.phone ?? "Anonymous";
              }
            } else if (reply.messageType === "ai") {
              replyAuthorName = "AI Assistant";
            } else if (reply.messageType === "system") {
              replyAuthorName = "System";
            }

            return {
              _id: reply._id,
              authorId: reply.authorId,
              content: reply.content,
              messageType: reply.messageType,
              createdAt: reply.createdAt,
              authorName: replyAuthorName,
            };
          })
        );

        return {
          _id: message._id,
          threadId: message.threadId,
          authorId: message.authorId,
          content: message.content,
          messageType: message.messageType,
          replyToId: message.replyToId,
          editedAt: message.editedAt,
          createdAt: message.createdAt,
          authorName,
          authorEmail,
          replies: enrichedReplies,
        };
      })
    );

    return {
      page: enrichedMessages,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const sendMessage = mutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    replyToId: v.optional(v.id("threadMessages")),
  },
  returns: v.id("threadMessages"),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Verify user is a participant in the thread
    const participation = await ctx.db
      .query("threadParticipants")
      .withIndex("by_thread_and_user", (q) => q.eq("threadId", args.threadId).eq("userId", user._id))
      .unique();

    if (!participation) {
      throw new Error("Not a participant in this thread");
    }

    // Verify thread exists and is not archived
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.isArchived) {
      throw new Error("Cannot send messages to archived thread");
    }

    // If replying to a message, verify it exists and belongs to this thread
    if (args.replyToId) {
      const replyToMessage = await ctx.db.get(args.replyToId);
      if (!replyToMessage || replyToMessage.threadId !== args.threadId) {
        throw new Error("Invalid reply target");
      }
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("threadMessages", {
      threadId: args.threadId,
      authorId: user._id,
      content: args.content,
      messageType: "text",
      replyToId: args.replyToId,
      createdAt: now,
    });

    // Update thread's last message timestamp
    await ctx.db.patch(args.threadId, {
      lastMessageAt: now,
    });

    return messageId;
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("threadMessages"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Only the author can edit their message
    if (message.authorId !== user._id) {
      throw new Error("Not authorized to edit this message");
    }

    // Can only edit text messages
    if (message.messageType !== "text") {
      throw new Error("Cannot edit system or AI messages");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      editedAt: Date.now(),
    });

    return null;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("threadMessages"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if user can delete this message (author or thread admin)
    const isAuthor = message.authorId === user._id;
    const participation = await ctx.db
      .query("threadParticipants")
      .withIndex("by_thread_and_user", (q) => q.eq("threadId", message.threadId).eq("userId", user._id))
      .unique();

    const isThreadAdmin = participation?.role === "admin";

    if (!isAuthor && !isThreadAdmin) {
      throw new Error("Not authorized to delete this message");
    }

    // Delete any replies to this message first
    const replies = await ctx.db
      .query("threadMessages")
      .withIndex("by_reply_to", (q) => q.eq("replyToId", args.messageId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    await ctx.db.delete(args.messageId);

    return null;
  },
});

// Internal function for AI or system messages
export const sendSystemMessage = internalMutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    messageType: v.union(v.literal("system"), v.literal("ai")),
  },
  returns: v.id("threadMessages"),
  handler: async (ctx, args) => {
    // Verify thread exists
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("threadMessages", {
      threadId: args.threadId,
      authorId: undefined, // System/AI messages have no user author
      content: args.content,
      messageType: args.messageType,
      createdAt: now,
    });

    // Update thread's last message timestamp
    await ctx.db.patch(args.threadId, {
      lastMessageAt: now,
    });

    return messageId;
  },
});

// Legacy functions for backward compatibility (deprecated)
export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("threadMessages"),
    body: v.string(),
    userId: v.id("users"),
    author: v.string(),
  })),
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    
    // Return empty array for now - this function is deprecated
    // Applications should migrate to thread-based messaging
    return [];
  },
});

export const send = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    
    // This function is deprecated - applications should use sendMessage with threads
    throw new Error("This function is deprecated. Please use thread-based messaging.");
  },
});
