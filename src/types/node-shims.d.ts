declare module "node:fs/promises" {
  export function readFile(path: string, encoding?: string): Promise<string>;
  export function writeFile(path: string, data: string | Uint8Array, encoding?: string): Promise<void>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readdir(path: string): Promise<string[]>;
  export function access(path: string, mode?: number): Promise<void>;
}

declare module "node:fs" {
  export const constants: { R_OK: number };
  export function createReadStream(path: string): { pipe(dest: unknown): void };
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function extname(path: string): string;
  export function normalize(path: string): string;
}

declare module "node:http" {
  export interface IncomingMessage extends AsyncIterable<Uint8Array> {
    url?: string;
    headers: Record<string, string | string[] | undefined>;
    method?: string;
  }
  export interface ServerResponse {
    writeHead(statusCode: number, headers?: Record<string, string>): void;
    end(data?: string | Uint8Array): void;
  }
  export function createServer(
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  ): { listen(port: number, cb?: () => void): void };
}

declare class URL {
  constructor(url: string, base?: string);
  pathname: string;
  searchParams: URLSearchParams;
}

declare class URLSearchParams {
  get(name: string): string | null;
}

declare class Buffer extends Uint8Array {
  static from(input: string | Uint8Array): Buffer;
  static concat(chunks: Buffer[]): Buffer;
  static isBuffer(value: unknown): value is Buffer;
  length: number;
}

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  cwd(): string;
  exit(code?: number): never;
};

declare const console: {
  log(message: string): void;
  error(message: unknown): void;
};
