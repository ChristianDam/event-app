"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

/**
 * Send invitation email (internal action)
 */
export const sendInvitationEmail = internalAction({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invitation = await ctx.runQuery(internal.teams.getInvitationDetails, {
      invitationId: args.invitationId,
    });

    if (!invitation) {
      return null;
    }

    const inviteUrl = `${process.env.SITE_URL || "http://localhost:3000"}/invite/${invitation.token}`;

    // Check if we're in development mode or if Resend domain is not configured
    const isDevelopment = process.env.NODE_ENV !== "production";
    const hasVerifiedDomain =
      process.env.AUTH_EMAIL && !process.env.AUTH_EMAIL.includes("resend.dev");

    if (isDevelopment && !hasVerifiedDomain) {
      // Development mode: Skip email sending but invitation is created
      return null;
    }

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.AUTH_RESEND_KEY);

      const { TeamInvitationEmail } = await import(
        "./emails/TeamInvitationEmail"
      );

      const { error } = await resend.emails.send({
        from:
          process.env.AUTH_EMAIL ?? "Creative Events <onboarding@resend.dev>",
        to: [invitation.email],
        subject: `You've been invited to join ${invitation.teamName}`,
        react: TeamInvitationEmail({
          teamName: invitation.teamName,
          inviterName: invitation.inviterName,
          role: invitation.role,
          inviteUrl,
        }),
      });

      if (error) {
        throw new Error(`Email sending failed: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      throw error;
    }

    return null;
  },
});
