// applescript-module.d.ts

declare module "applescript" {
  export const Parsers: {
    parse: (input: string) => any;
  };

  export let osascript: string;

  export function execFile(
    file: string,
    args: string[],
    callback: (err: Error | null, result: any, stderr: string) => void
  ): void;
  export function execFile(
    file: string,
    callback: (err: Error | null, result: any, stderr: string) => void
  ): void;

  export function execString(
    str: string,
    callback: (err: Error | null, result: any, stderr: string) => void
  ): void;
}
