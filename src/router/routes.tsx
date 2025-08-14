import { router, RouteDefinition } from './fileBasedRouter';

// Import all page components
import HomePage from '../pages/index';
import InviteTokenPage from '../pages/invite/[token]';
import TeamIdPage from '../pages/team/[id]';
import PublicEventPage from '../pages/events/[slug]';

// Define all routes
const routes: RouteDefinition[] = [
  {
    path: '/',
    component: HomePage,
    authRequired: true,
  },
  {
    path: '/invite/[token]',
    component: InviteTokenPage,
    authRequired: false, // Public invitation pages
  },
  {
    path: '/team/[id]',
    component: TeamIdPage,
    authRequired: true,
  },
  {
    path: '/events/[slug]',
    component: PublicEventPage,
    authRequired: false, // Public event pages
  },
];

// Register all routes
routes.forEach(route => router.addRoute(route));

export { router };