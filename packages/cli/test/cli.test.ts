import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const cliDir = join(__dirname, "..");
const cliPath = join(cliDir, "dist", "cli.js");
const fixtureDir = join(
  cliDir,
  "..",
  "core",
  "test",
  "fixtures",
  "with-config"
);

function runCli(args: string[]): {
  stdout: string;
  stderr: string;
  status: number;
} {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: cliDir,
    encoding: "utf8",
    env: { ...process.env }
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status ?? (result.signal ? 1 : 0)
  };
}

describe("CLI rootDir validation", () => {
  it("exits with 1 and prints error when rootDir does not exist", () => {
    const { stderr, status } = runCli(["analyze", "/nonexistent-path-12345"]);
    expect(status).toBe(1);
    expect(stderr).toMatch(/directory not found|ENOENT|not found/i);
  });

  it("exits with 1 and prints error when rootDir is a file not a directory", () => {
    const filePath = join(
      cliDir,
      "..",
      "core",
      "test",
      "fixtures",
      "with-config",
      "Button.tsx"
    );
    const { stderr: err, status } = runCli(["analyze", filePath]);
    expect(status).toBe(1);
    expect(err).toMatch(/not a directory/i);
  });

  it("succeeds when rootDir is a valid directory", () => {
    const dirPath = join(
      cliDir,
      "..",
      "core",
      "test",
      "fixtures",
      "with-config"
    );
    const { stdout, status } = runCli(["analyze", dirPath]);
    expect(status).toBe(0);
    expect(stdout).toMatch(/Scanned files:/);
  });

  it("--report json includes log, truncated, filesLimit, filesScannedPaths, and perFileDetails", () => {
    const { stdout, status } = runCli([
      "analyze",
      fixtureDir,
      "--report",
      "json"
    ]);
    expect(status).toBe(0);
    const payload = JSON.parse(stdout) as Record<string, unknown>;
    expect(Array.isArray(payload.log)).toBe(true);
    expect(payload.truncated).toBe(false);
    expect(payload.filesLimit).toBe(null);
    expect(Array.isArray(payload.filesScannedPaths)).toBe(true);
    expect((payload.filesScannedPaths as string[]).length).toBe(
      payload.filesScanned as number
    );
    expect(Array.isArray(payload.perFileDetails)).toBe(true);
    expect(
      (payload.log as Array<{ message: string }>).some((e) =>
        e.message.includes("Collected")
      )
    ).toBe(true);
  });

  it("--output writes JSON report to file with filesScannedPaths", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "tailwind-architect-cli-"));
    const reportPath = join(tmp, "report.json");
    try {
      const result = spawnSync(
        process.execPath,
        [cliPath, "analyze", fixtureDir, "--output", reportPath],
        {
          cwd: cliDir,
          encoding: "utf8",
          env: { ...process.env }
        }
      );
      expect(result.status).toBe(0);
      const content = await readFile(reportPath, "utf8");
      const payload = JSON.parse(content) as Record<string, unknown>;
      expect(Array.isArray(payload.filesScannedPaths)).toBe(true);
      expect((payload.filesScannedPaths as string[]).length).toBeGreaterThan(0);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("--output with --detailed includes perFileDetails when issues exist", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "tailwind-architect-cli-"));
    const reportPath = join(tmp, "report.json");
    try {
      const result = spawnSync(
        process.execPath,
        [cliPath, "analyze", fixtureDir, "--output", reportPath, "--detailed"],
        { cwd: cliDir, encoding: "utf8", env: { ...process.env } }
      );
      expect(result.status).toBe(0);
      const content = await readFile(reportPath, "utf8");
      const payload = JSON.parse(content) as Record<string, unknown>;
      expect(Array.isArray(payload.perFileDetails)).toBe(true);
      if ((payload.filesWithIssues as number) > 0) {
        expect((payload.perFileDetails as unknown[]).length).toBeGreaterThan(0);
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
