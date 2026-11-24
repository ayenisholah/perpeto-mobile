/**
 * Corner radii. Section 12.1 squares every surface, as AgentFloor does: cards,
 * sheets, fields, buttons, badges and chips all sit at 0. The named steps stay
 * so call sites keep their intent if a radius is ever reintroduced.
 *
 * `dot` is the one exception and is reserved for round status dots.
 */
export const radius = {
  sm: 0,
  md: 0,
  lg: 0,
  dot: 999,
} as const;

export type Radius = keyof typeof radius;
