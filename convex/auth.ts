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
});
