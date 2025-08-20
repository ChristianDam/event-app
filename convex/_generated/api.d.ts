/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as emails_TeamInvitationEmail from "../emails/TeamInvitationEmail.js";
import type * as events from "../events.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as messages from "../messages.js";
import type * as otp_ResendOTP from "../otp/ResendOTP.js";
import type * as otp_VerificationCodeEmail from "../otp/VerificationCodeEmail.js";
import type * as teamEmails from "../teamEmails.js";
import type * as teams from "../teams.js";
import type * as threads from "../threads.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "emails/TeamInvitationEmail": typeof emails_TeamInvitationEmail;
  events: typeof events;
  helpers: typeof helpers;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  messages: typeof messages;
  "otp/ResendOTP": typeof otp_ResendOTP;
  "otp/VerificationCodeEmail": typeof otp_VerificationCodeEmail;
  teamEmails: typeof teamEmails;
  teams: typeof teams;
  threads: typeof threads;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
