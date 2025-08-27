import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAuth } from "./lib/auth";

/**
 * Generate an upload URL for file uploads
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Require authentication for file uploads
    await requireAuth(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Delete a file from storage
 */
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Require authentication for file deletion
    await requireAuth(ctx);

    await ctx.storage.delete(args.storageId);

    return null;
  },
});
