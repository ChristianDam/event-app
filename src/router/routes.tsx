import { router, RouteDefinition } from './fileBasedRouter';

// Import all page components
import HomePage from '../pages/index';
import InviteTokenPage from '../pages/invite/[token]';
import TeamIdPage from '../pages/team/[id]';

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
];

// Register all routes
routes.forEach(route => router.addRoute(route));

export { router };