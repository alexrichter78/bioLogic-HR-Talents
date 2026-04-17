import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { spawn } from "child_process";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  if (process.env.DATABASE_URL && process.env.SKIP_DB_PUSH !== "1") {
    console.log("syncing database schema (drizzle-kit push)...");
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "npx",
        ["drizzle-kit", "push", "--force"],
        { stdio: "inherit", shell: true },
      );
      child.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`drizzle-kit push exited with code ${code}`));
      });
      child.on("error", reject);
    });
  } else {
    console.log("skipping db:push (no DATABASE_URL or SKIP_DB_PUSH=1)");
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
