/**
 * Logic tests for the fixed sync engine (fix/dot-obsidian-sync).
 * Mocks the Obsidian surface (Vault/adapter/settings) and drives SyncEngine
 * through the scenarios that matter for the .obsidian sync fix.
 * Run: node tests/sync-engine.test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const repo = path.resolve(new URL("..", import.meta.url).pathname);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gsb-test-"));

// Build a test entry that bundles the plugin src, aliasing 'obsidian' to a stub.
execSync(
  `npx esbuild src/sync.ts --bundle --format=cjs --platform=node ` +
    `--alias:obsidian=${path.join(repo, "tests/obsidian-mock.mjs")} ` +
    `--outfile=${tmp}/sync.cjs`,
  { cwd: repo, stdio: "pipe" }
);

// ---- Obsidian surface mocks ------------------------------------------------
class MockAdapter {
  constructor(root) {
    this.root = root;
  }
  p(rel) { return path.join(this.root, rel); }
  async list(dir) {
    const abs = this.p(dir);
    if (!fs.existsSync(abs)) throw new Error("not found");
    const out = { files: [], folders: [] };
    for (const name of fs.readdirSync(abs)) {
      const full = path.join(abs, name);
      const rel = `${dir}/${name}`;
      if (fs.statSync(full).isDirectory()) out.folders.push(rel);
      else out.files.push(rel);
    }
    return out;
  }
  async stat(rel) {
    const st = fs.statSync(this.p(rel));
    return { size: st.size, mtime: st.mtimeMs };
  }
  async readBinary(rel) {
    const buf = fs.readFileSync(this.p(rel));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  async writeBinary(rel, data) {
    fs.mkdirSync(path.dirname(this.p(rel)), { recursive: true });
    fs.writeFileSync(this.p(rel), Buffer.from(data));
  }
  async mkdir(rel) { fs.mkdirSync(this.p(rel), { recursive: true }); }
  async remove(rel) { fs.rmSync(this.p(rel), { recursive: true, force: true }); }
}

// git blob sha1 — same as githost.ts
async function gitBlobSha1(data) {
  const { createHash } = await import("node:crypto");
  const header = Buffer.from(`blob ${data.byteLength}\0`);
  return createHash("sha1").update(Buffer.concat([header, Buffer.from(data)])).digest("hex");
}

class MockBackend {
  constructor(root) { this.vaultRoot = root; this.id = "git-blob-sha1"; }
  async hashData(data) { return gitBlobSha1(data); }
  async manifest() {
    const out = [];
    const walk = (rel) => {
      const abs = path.join(this.vaultRoot, rel);
      for (const name of fs.existsSync(abs) ? fs.readdirSync(abs) : []) {
        const r = rel ? `${rel}/${name}` : name;
        const full = path.join(abs, name);
        if (fs.statSync(full).isDirectory()) walk(r);
        else out.push({ path: r, hash: gitBlobSha1(fs.readFileSync(full)), mtime: 0, size: fs.statSync(full).size });
      }
    };
    walk("");
    return out;
  }
  async download(p) {
    const buf = fs.readFileSync(path.join(this.vaultRoot, p));
    return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), hash: await gitBlobSha1(buf), mtime: 0 };
  }
  async upload(p, data) {
    fs.mkdirSync(path.dirname(path.join(this.vaultRoot, p)), { recursive: true });
    fs.writeFileSync(path.join(this.vaultRoot, p), Buffer.from(data));
  }
  async remove(p) { fs.rmSync(path.join(this.vaultRoot, p), { force: true }); }
}

class MockVault {
  constructor(root) {
    this.root = root;
    this.adapter = new MockAdapter(root);
  }
  p(rel) { return path.join(this.root, rel); }
  getFiles() {
    // Reproduce Obsidian: index skips hidden segments entirely.
    const out = [];
    const walk = (rel) => {
      for (const name of fs.existsSync(this.p(rel)) ? fs.readdirSync(this.p(rel)) : []) {
        if (name.startsWith(".")) continue;
        const r = rel ? `${rel}/${name}` : name;
        const full = this.p(r);
        if (fs.statSync(full).isDirectory()) walk(r);
        else out.push({ path: r, stat: fs.statSync(full) });
      }
    };
    walk("");
    return out;
  }
  getAbstractFileByPath(p) {
    const full = this.p(p);
    if (!fs.existsSync(full) || p.split("/").some((s) => s.startsWith("."))) return null;
    const st = fs.statSync(full);
    if (st.isDirectory()) return { path: p };
    const f = new TFile();
    f.path = p;
    f.stat = st;
    return f;
  }
  async readBinary(f) { return this.adapter.readBinary(f.path); }
  async createBinary(p, data) { await this.adapter.writeBinary(p, data); }
  async modifyBinary(f, data) { await this.adapter.writeBinary(f.path, data); }
  async trash(f) { fs.rmSync(this.p(f.path)); }
}

// ---- Plugin double ----------------------------------------------------------
function makePlugin(vault, { toggle, backend }) {
  return {
    app: { vault },
    settings: {
      syncDotObsidian: toggle,
      excludeFolders: "",
      backend: "github",
      githubOwner: "t", githubRepo: "t", githubBranch: "main", githubToken: "t",
      __testBackend: backend,
    },
    syncState: {},
    hashCache: {},
    appendLog: async () => {},
    savePluginData: async () => {},
  };
}

async function read(p) { return fs.readFileSync(p); }
async function write(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
}

const { SyncEngine, TFile } = await import(path.join(tmp, "sync.cjs"));

let passed = 0, failed = 0;
function check(name, cond, detail = "") {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name} ${detail}`); }
}

async function scenario(name, fn) {
  console.log(`\n== ${name}`);
  const local = fs.mkdtempSync(path.join(tmp, "local-"));
  const remote = fs.mkdtempSync(path.join(tmp, "remote-"));
  await fn(local, remote);
}

// T1: toggle ON, theme modified locally, remote in baseline → must PUSH.
await scenario("T1 toggle ON: local theme change is detected and pushed", async (local, remote) => {
  await write(path.join(local, ".obsidian/themes/T/theme.css"), "body{}");
  await write(path.join(remote, ".obsidian/themes/T/theme.css"), "body{}");
  const vault = new MockVault(local);
  const plugin = makePlugin(vault, { toggle: true, backend: new MockBackend(remote) });
  const engine = new SyncEngine(plugin);
  // Seed baseline: pretend last sync recorded the remote hash.
  const remHash = await gitBlobSha1(await read(path.join(remote, ".obsidian/themes/T/theme.css")));
  plugin.syncState = { ".obsidian/themes/T/theme.css": remHash };
  await write(path.join(local, ".obsidian/themes/T/theme.css"), "body{color:red}");
  const summary = await engine.run();
  check("pushed == 1", summary.pushed === 1, `got ${summary.pushed}`);
  check("remote theme.css updated", (await read(path.join(remote, ".obsidian/themes/T/theme.css"))).toString() === "body{color:red}");
});

// T2: toggle OFF, same change → no actions (hidden stays excluded).
await scenario("T2 toggle OFF: .obsidian stays invisible, no changes", async (local, remote) => {
  await write(path.join(local, ".obsidian/themes/T/theme.css"), "body{color:blue}");
  const vault = new MockVault(local);
  const plugin = makePlugin(vault, { toggle: false, backend: new MockBackend(remote) });
  const summary = await new SyncEngine(plugin).run();
  check("no pushes", summary.pushed === 0, `got ${summary.pushed}`);
  check("no pulls", summary.pulled === 0);
});

// T3: toggle ON, new file only on remote under .obsidian → pulled via adapter, lands on disk.
await scenario("T3 toggle ON: remote-only .obsidian file is pulled to disk", async (local, remote) => {
  await write(path.join(remote, ".obsidian/appearance.json"), '{"accentColor":"#ff0"}');
  const vault = new MockVault(local);
  const plugin = makePlugin(vault, { toggle: true, backend: new MockBackend(remote) });
  const summary = await new SyncEngine(plugin).run();
  check("pulled == 1", summary.pulled === 1, `got ${summary.pulled}`);
  check("file written under .obsidian", fs.existsSync(path.join(local, ".obsidian/appearance.json")));
});

// T4: workspace.json excluded even with toggle ON.
await scenario("T4 workspace.json is always excluded", async (local, remote) => {
  await write(path.join(remote, ".obsidian/workspace.json"), '{"layout":1}');
  await write(path.join(remote, ".obsidian/appearance.json"), '{}');
  const vault = new MockVault(local);
  const plugin = makePlugin(vault, { toggle: true, backend: new MockBackend(remote) });
  const summary = await new SyncEngine(plugin).run();
  check("appearance pulled", fs.existsSync(path.join(local, ".obsidian/appearance.json")));
  check("workspace.json NOT pulled", !fs.existsSync(path.join(local, ".obsidian/workspace.json")));
});

// T5: deletion propagation — remote .obsidian file removed, local copy gets deleted.
await scenario("T5 toggle ON: remote deletion of .obsidian file propagates locally", async (local, remote) => {
  await write(path.join(local, ".obsidian/hotkeys.json"), "{}");
  await write(path.join(remote, ".obsidian/hotkeys.json"), "{}");
  const vault = new MockVault(local);
  const plugin = makePlugin(vault, { toggle: true, backend: new MockBackend(remote) });
  const h = await gitBlobSha1(await read(path.join(remote, ".obsidian/hotkeys.json")));
  plugin.syncState = { ".obsidian/hotkeys.json": h };
  fs.rmSync(path.join(remote, ".obsidian/hotkeys.json"));
  const summary = await new SyncEngine(plugin).run();
  check("deletedLocal == 1", summary.deletedLocal === 1, `got ${summary.deletedLocal}`);
  check("local file gone", !fs.existsSync(path.join(local, ".obsidian/hotkeys.json")));
});

// T6: normal files unaffected — plain markdown still pushes.
await scenario("T6 regression: normal markdown sync unchanged", async (local, remote) => {
  await write(path.join(local, "Inbox/note.md"), "hello");
  const vault = new MockVault(local);
  const plugin = makePlugin(vault, { toggle: false, backend: new MockBackend(remote) });
  const summary = await new SyncEngine(plugin).run();
  check("pushed == 1", summary.pushed === 1, `got ${summary.pushed}`);
  check("remote has note", fs.existsSync(path.join(remote, "Inbox/note.md")));
});

// T7: pull over existing hidden file (the old createBinary crash path).
// Seed a baseline first, then change only the remote side.
await scenario("T7 pull overwrites an existing hidden file without error", async (local, remote) => {
  await write(path.join(local, ".obsidian/appearance.json"), '{"old":1}');
  await write(path.join(remote, ".obsidian/appearance.json"), '{"old":1}');
  const vault = new MockVault(local);
  const plugin = makePlugin(vault, { toggle: true, backend: new MockBackend(remote) });
  const h = await gitBlobSha1(await read(path.join(remote, ".obsidian/appearance.json")));
  plugin.syncState = { ".obsidian/appearance.json": h };
  await write(path.join(remote, ".obsidian/appearance.json"), '{"new":2}');
  const summary = await new SyncEngine(plugin).run();
  check("pulled == 1", summary.pulled === 1, `got ${summary.pulled}`);
  check("content overwritten", (await read(path.join(local, ".obsidian/appearance.json"))).toString() === '{"new":2}');
});

// T8: empty hidden file is skipped, not wiped remotely.
await scenario("T8 empty local hidden file is skipped (no remote deletion)", async (local, remote) => {
  await write(path.join(local, ".obsidian/empty.json"), "");
  await write(path.join(remote, ".obsidian/empty.json"), "{}");
  const vault = new MockVault(local);
  const plugin = makePlugin(vault, { toggle: true, backend: new MockBackend(remote) });
  const summary = await new SyncEngine(plugin).run();
  check("no remote deletion", summary.deletedRemote === 0, `got ${summary.deletedRemote}`);
  check("remote file still there", fs.existsSync(path.join(remote, ".obsidian/empty.json")));
});

console.log(`\n======== ${passed} passed, ${failed} failed ========`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
