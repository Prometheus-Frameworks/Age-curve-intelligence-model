declare module "node:fs/promises" {
  export function readFile(path: string, encoding: string): Promise<string>;
  export function writeFile(path: string, data: string, encoding: string): Promise<void>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function extname(path: string): string;
}

declare const process: {
  argv: string[];
  exit(code?: number): never;
};
