import { access, readFile, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const root = process.cwd();
const errors = [];
const execFileAsync = promisify(execFile);

const requiredFiles = [
  "README.md",
  ".env.local.example",
  "docs/user-stories.md",
  "docs/software-requirements-specification.md",
  "docs/requirements-traceability-matrix.md",
  "docs/test-plan.md",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/user-story.md",
];

const jsonFiles = ["package.json", "firebase.json", "firestore.indexes.json"];
const ignoredDirectories = new Set([".git", ".next", "node_modules", "coverage"]);
const textExtensions = new Set([".js", ".mjs", ".json", ".md", ".yml", ".yaml", ".rules"]);

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
    } else if (textExtensions.has(path.extname(entry.name)) || entry.name === ".env.local.example") {
      files.push(absolutePath);
    }
  }

  return files;
}

for (const relativePath of requiredFiles) {
  if (!(await exists(relativePath))) errors.push(`Missing required file: ${relativePath}`);
}

for (const relativePath of jsonFiles) {
  try {
    JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON in ${relativePath}: ${error.message}`);
  }
}

for (const secretPath of [".env.local", "serviceAccountKey.json"]) {
  try {
    await execFileAsync("git", ["ls-files", "--error-unmatch", secretPath], {
      cwd: root,
    });
    errors.push(`Sensitive local file is tracked by Git: ${secretPath}`);
  } catch (error) {
    // Exit code 1 means the file is not tracked, which is the expected state.
    if (error.code !== 1) {
      errors.push(`Could not verify Git tracking for ${secretPath}: ${error.message}`);
    }
  }
}

for (const absolutePath of await collectFiles()) {
  const relativePath = path.relative(root, absolutePath);
  const contents = await readFile(absolutePath, "utf8");

  if (/^<<<<<<< |^>>>>>>> /m.test(contents)) {
    errors.push(`Unresolved merge marker in ${relativePath}`);
  }

  if (/\bElena\b/.test(contents)) {
    errors.push(`Stale team-member name in ${relativePath}: use Alina`);
  }

  if (
    relativePath !== "scripts/check-source.mjs" &&
    /\b(?:ChatGPT|Claude|Codex|GitHub Copilot)\b|\b(?:generated|written) by (?:an )?AI\b/i.test(contents)
  ) {
    errors.push(`Assistant attribution found in ${relativePath}: rewrite as project-owned content`);
  }

  if (/\bWeek (5|6|7)\b/.test(contents)) {
    errors.push(`Stale Sprint checkpoint numbering in ${relativePath}`);
  }
}

if (errors.length) {
  console.error("Repository checks failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Repository structure, JSON, naming, merge-marker, and secret-file checks passed.");
