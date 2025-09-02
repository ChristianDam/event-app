import EventManagePage from "../pages/events/[id]";
import PublicEventPage from "../pages/events/[slug]";
import EventsPage from "../pages/events/index";
// Import all page components
import HomePage from "../pages/index";
import InviteTokenPage from "../pages/invite/[token]";
import MessagesPage from "../pages/messages";
import SettingsPage from "../pages/settings";
import TeamIdPage from "../pages/team/[id]";
import TeamPage from "../pages/team/index";
import { type RouteDefinition, router } from "./fileBasedRouter";

// Define all routes
const routes: RouteDefinition[] = [
  {
    path: "/",
    component: HomePage,
    authRequired: true,
  },
  {
    path: "/events",
    component: EventsPage,
    authRequired: true,
  },
  {
    path: "/messages",
    component: MessagesPage,
    authRequired: true,
  },
  {
    path: "/settings",
    component: SettingsPage,
    authRequired: true,
  },
  {
    path: "/team",
    component: TeamPage,
    authRequired: true,
  },
  {
    path: "/invite/[token]",
    component: InviteTokenPage,
    authRequired: false, // Public invitation pages
  },
  {
    path: "/team/[id]",
    component: TeamIdPage,
    authRequired: true,
  },
  {
    path: "/events/discover/[slug]",
    component: PublicEventPage,
    authRequired: false, // Public event pages
  },
  {
    path: "/events/[id]",
    component: EventManagePage,
    authRequired: true, // Organizers only
  },
];

// Register all routes
routes.forEach((route) => router.addRoute(route));

export { router };
