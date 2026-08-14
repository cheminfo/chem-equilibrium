/** Every page of the site, in navigation order. */
export const ROUTES = [
  { path: '/', label: 'Home' },
  { path: '/ph', label: 'pH calculator' },
  { path: '/titration', label: 'Titration' },
  { path: '/speciation', label: 'Acid/base speciation' },
  { path: '/precipitation', label: 'Precipitation' },
  { path: '/equilibrium', label: 'Any equilibrium' },
  { path: '/exercises', label: 'Exercises' },
  { path: '/how-it-works', label: 'How it works' },
  { path: '/data', label: 'Data' },
  { path: '/about', label: 'About' },
] as const;

export type RoutePath = (typeof ROUTES)[number]['path'];

/**
 * The interactive tools, in the order the home page presents them; each is
 * independently shareable through its URL.
 */
export const TOOL_PATHS = [
  '/ph',
  '/titration',
  '/speciation',
  '/precipitation',
  '/equilibrium',
  '/exercises',
] as const satisfies readonly RoutePath[];

/** Route of one of the interactive tools. */
export type ToolPath = (typeof TOOL_PATHS)[number];

/**
 * Whether a string read from the hash is one of the site's pages.
 * @param value - The candidate path.
 * @returns Whether it names a route.
 */
export function isRoutePath(value: string): value is RoutePath {
  return ROUTES.some((route) => route.path === value);
}

/**
 * The tab label of a page.
 * @param path - The route path.
 * @returns Its label, or the path itself when it has none.
 */
export function labelOf(path: RoutePath): string {
  return ROUTES.find((route) => route.path === path)?.label ?? path;
}
