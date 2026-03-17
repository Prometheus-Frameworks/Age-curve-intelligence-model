export const POSITIONS = ["QB", "RB", "WR", "TE"] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_SET = new Set<string>(POSITIONS);
