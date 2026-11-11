import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

// Build a clean static publish directory while keeping Netlify Functions
// in the configured netlify/functions directory for Netlify's build pipeline.
if (existsSync("dist")) await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const name of ["index.html", "logo.jpg", "banner.jpg", "offer.png", "demo.mp4", "demo-poster.jpg"]) {
  if (existsSync(name)) await cp(name, `dist/${name}`);
}
console.log("Build complete: static site copied to dist/");
