import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("loadProjectEnv", () => {
  const sentinelVars = ["LCDEV_TEST_VAR_A", "LCDEV_TEST_VAR_B", "LCDEV_TEST_VAR_C"];
  const saved: Record<string, string | undefined> = {};
  let tmp: string;

  beforeEach(() => {
    for (const v of sentinelVars) {
      saved[v] = process.env[v];
      delete process.env[v];
    }
    tmp = mkdtempSync(join(tmpdir(), "lcdev-env-test-"));
  });

  afterEach(() => {
    for (const v of sentinelVars) {
      if (saved[v] !== undefined) process.env[v] = saved[v];
      else delete process.env[v];
    }
    rmSync(tmp, { recursive: true, force: true });
  });

  test("loads variables from a .env file into process.env", async () => {
    const envPath = join(tmp, ".env");
    writeFileSync(envPath, "LCDEV_TEST_VAR_A=value-from-dotenv\n");
    const { loadProjectEnv } = await import("./env.ts");

    loadProjectEnv(envPath);

    expect(process.env["LCDEV_TEST_VAR_A"]).toBe("value-from-dotenv");
  });

  test("does NOT overwrite variables already present in process.env", async () => {
    process.env["LCDEV_TEST_VAR_B"] = "from-shell";
    const envPath = join(tmp, ".env");
    writeFileSync(envPath, "LCDEV_TEST_VAR_B=from-dotenv\n");
    const { loadProjectEnv } = await import("./env.ts");

    loadProjectEnv(envPath);

    expect(process.env["LCDEV_TEST_VAR_B"]).toBe("from-shell");
  });

  test("is a no-op when the .env file does not exist", async () => {
    const envPath = join(tmp, "does-not-exist.env");
    const { loadProjectEnv } = await import("./env.ts");

    expect(() => loadProjectEnv(envPath)).not.toThrow();
    expect(process.env["LCDEV_TEST_VAR_C"]).toBeUndefined();
  });

  test("loads multiple variables from a single .env", async () => {
    const envPath = join(tmp, ".env");
    writeFileSync(
      envPath,
      "LCDEV_TEST_VAR_A=first\nLCDEV_TEST_VAR_C=third\n",
    );
    const { loadProjectEnv } = await import("./env.ts");

    loadProjectEnv(envPath);

    expect(process.env["LCDEV_TEST_VAR_A"]).toBe("first");
    expect(process.env["LCDEV_TEST_VAR_C"]).toBe("third");
  });
});
