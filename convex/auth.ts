import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";
import { ResendOTP } from "./otp/ResendOTP";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Resend({
      from: process.env.AUTH_EMAIL ?? "Event app",
    }),
    ResendOTP,
    Anonymous,
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Check if this is a new user by seeing if they exist
      const existingUser = await ctx.db.get(args.existingUserId ?? ("" as any));

      if (args.existingUserId && existingUser) {
        // Existing user - update if needed
        if (
          args.profile.name !== existingUser.name ||
          args.profile.email !== existingUser.email ||
          args.profile.image !== existingUser.image
        ) {
          await ctx.db.patch(args.existingUserId, {
            name: args.profile.name,
            email: args.profile.email,
            image: args.profile.image,
          });
        }
        return args.existingUserId;
      } else {
        // New user - create user and default team
        const userId = await ctx.db.insert("users", {
          name: args.profile.name,
          email: args.profile.email,
          image: args.profile.image,
          emailVerificationTime: args.profile.emailVerified
            ? Date.now()
            : undefined,
        });

        // Create default team for new user (temporarily disabled until API generation)
        // await ctx.scheduler.runAfter(0, internal.teams.createDefaultTeam, {
        //   userId,
        // });

        return userId;
      }
    },
  },
});
