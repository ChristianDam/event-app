import type React from "react";

// Page component type
export type PageComponent = React.ComponentType<{
  params: Record<string, string>;
  navigate: (to: string) => void;
}>;

// Route definition
export interface RouteDefinition {
  path: string;
  component: PageComponent;
  authRequired?: boolean;
}

// Route matcher result
export interface RouteMatch {
  route: RouteDefinition;
  params: Record<string, string>;
}

export class FileBasedRouter {
  private routes: RouteDefinition[] = [];

  // Register a route
  addRoute(route: RouteDefinition) {
    this.routes.push(route);
  }

  // Match current pathname to a route
  matchRoute(pathname: string): RouteMatch | null {
    for (const route of this.routes) {
      const params = this.matchPath(route.path, pathname);
      if (params !== null) {
        return { route, params };
      }
    }
    return null;
  }

  // Match a path pattern against a pathname
  private matchPath(
    pattern: string,
    pathname: string
  ): Record<string, string> | null {
    // Convert pattern like '/team/[id]' to regex
    const paramNames: string[] = [];
    const regexPattern = pattern
      .replace(/\[([^\]]+)\]/g, (_, paramName) => {
        paramNames.push(paramName);
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPattern}$`);
    const match = pathname.match(regex);

    if (!match) {
      return null;
    }

    // Extract parameters
    const params: Record<string, string> = {};
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1];
    });

    return params;
  }

  // Get all registered routes
  getRoutes(): RouteDefinition[] {
    return [...this.routes];
  }
}

// Global router instance
export const router = new FileBasedRouter();
