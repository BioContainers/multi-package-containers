/// <reference path="../.astro/types.d.ts" />

declare module "*.json" {
  const value: unknown;
  export default value;
}
