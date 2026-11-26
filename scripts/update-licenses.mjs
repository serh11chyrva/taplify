import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { posix } from "node:path";
import { Readable, Transform } from "node:stream";
import { buffer, text } from "node:stream/consumers";
import { pipeline } from "node:stream/promises";
import { createGunzip, gunzipSync } from "node:zlib";
import { loadAll } from "js-yaml";
import tar from "tar-stream";

const registry = new URL("https://registry.npmjs.org/");
const lockfilePath = new URL("../pnpm-lock.yaml", import.meta.url);
const catalogPath = new URL("../src/app/(legal)/licenses/dependency-licenses.json", import.meta.url);
const noticesPath = new URL("../public/third-party-notices.txt", import.meta.url);
const cacheDirectory = new URL("../node_modules/.cache/taplify-licenses-v1/", import.meta.url);
const downloadConcurrency = 10;
const manifestFilename = /^(?:[^/]+\/)?package\.json$/;
const readmeFilename = /^(?:[^/]+\/)?readme(?:\.md|\.txt)?$/i;

const assets = [
  {
    name: "Geist and Geist Mono",
    license: "SIL Open Font License 1.1",
    author: "The Geist Project Authors",
    file: "src/app/_fonts/OFL.txt",
  },
  {
    name: "React Bits Dither",
    license: "MIT + Commons Clause License Condition v1.0",
    author: "David Haz",
    file: "src/app/_landing/react-bits.LICENSE.md",
  },
];

function lockedPackages(lockfile) {
  const packages = new Map();

  for (const document of loadAll(lockfile)) {
    if (document.lockfileVersion !== "9.0") {
      throw new Error(`Unsupported pnpm lockfile version ${document.lockfileVersion}.`);
    }

    for (const [key, { resolution }] of Object.entries(document.packages ?? {})) {
      const separator = key.lastIndexOf("@");
      const name = key.slice(0, separator);
      const version = key.slice(separator + 1);
      const integrity = resolution?.integrity;

      if (separator <= 0 || !version || !integrity) {
        throw new Error(`Expected a pinned package archive with integrity for ${key}.`);
      }

      const archiveName = `${name.split("/").at(-1)}-${version}.tgz`;
      const archive = new URL(resolution.tarball ?? `${name}/-/${archiveName}`, registry);
      const previous = packages.get(key);
      if (previous && previous.integrity !== integrity) {
        throw new Error(`Conflicting archive integrity for ${key}.`);
      }

      packages.set(key, { name, version, integrity, archive });
    }
  }

  return [...packages.keys()].sort().map((key) => packages.get(key));
}

function isNoticeFile(path) {
  const filename = posix.basename(path);
  if (/\.(?:[cm]?js|[cm]?ts|map|svg|png|jpe?g|woff2?|exe|node|wasm)$/i.test(filename)) return false;

  return /^(?:licen[cs]es?|notices?|copying|copyright(?:notice)?|unlicense|ofl|third[._ -]?party[._ -]?(?:licen[cs]es?|notices?))(?:$|[._ -])/i.test(filename)
    || /[._-](?:licen[cs]e|notice)\.(?:txt|md)$/i.test(filename)
    || /(?:^|\/)licen[cs]es\//i.test(path);
}

function readmeLicensingSection(readme) {
  const heading = /^(#{1,6})[\t ]+(?:(?:third[- ]party|open[- ]source)[\t ]+)?(?:licen[cs](?:es?|ing)|notices?|copyright)[\t ]*\r?$/im.exec(readme);
  if (!heading) return "";

  const bodyStart = heading.index + heading[0].length;
  const nextSection = new RegExp(`^#{1,${heading[1].length}}[\\t ]+`, "m");
  const bodyLength = readme.slice(bodyStart).search(nextSection);
  return readme.slice(heading.index, bodyLength === -1 ? undefined : bodyStart + bodyLength);
}

async function readArchiveFiles(extractor) {
  const files = new Map();

  for await (const entry of extractor) {
    const path = entry.header.name.replace(/^\.\//, "");
    if (entry.header.type === "file" && (manifestFilename.test(path) || readmeFilename.test(path) || isNoticeFile(path))) {
      const contents = path.endsWith(".gz") ? gunzipSync(await buffer(entry)).toString("utf8") : await text(entry);
      if (contents.includes("\0")) throw new Error(`Expected text in ${path}.`);
      files.set(path, contents);
    } else {
      entry.resume();
    }
  }

  return files;
}

async function downloadArchive({ archive, integrity }) {
  const response = await fetch(archive, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Package archive returned HTTP ${response.status}.`);

  const algorithm = integrity.split("-", 1)[0];
  const hash = createHash(algorithm);
  const hashStream = new Transform({
    transform(chunk, encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  const extractor = tar.extract();
  const [, files] = await Promise.all([
    pipeline(Readable.fromWeb(response.body), hashStream, createGunzip(), extractor),
    readArchiveFiles(extractor),
  ]);

  if (`${algorithm}-${hash.digest("base64")}` !== integrity) {
    throw new Error("Package archive does not match the lockfile integrity.");
  }

  return files;
}

async function replaceFile(path, content) {
  const temporary = new URL(`${path.href}.${process.pid}.tmp`);
  try {
    await writeFile(temporary, content);
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

async function readPackage(pkg) {
  const { name, version, integrity } = pkg;
  const cacheKey = createHash("sha256").update(`${name}@${version}:${integrity}`).digest("hex");
  const cachePath = new URL(`${cacheKey}.json`, cacheDirectory);

  try {
    return JSON.parse(await readFile(cachePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }

  const files = await downloadArchive(pkg);
  const manifestPath = [...files.keys()].find((path) => manifestFilename.test(path));
  if (!manifestPath) throw new Error("Package archive has no root manifest.");

  const manifest = JSON.parse(files.get(manifestPath));
  if (manifest.name !== name || manifest.version !== version) {
    throw new Error(`Archive contains ${manifest.name}@${manifest.version}.`);
  }

  files.delete(manifestPath);
  const readmePath = [...files.keys()].find((path) => readmeFilename.test(path));
  if (readmePath) {
    const readme = files.get(readmePath);
    files.delete(readmePath);

    // Sharp's native packages publish bundled-library attribution in their README.
    if (files.size === 0 || name.startsWith("@img/sharp-")) {
      const section = readmeLicensingSection(readme);
      if (section) files.set(readmePath, section);
    }
  }

  const result = {
    license: manifest.license,
    notices: [...files.keys()].sort().map((path) => [path, files.get(path)]),
  };
  await replaceFile(cachePath, JSON.stringify(result));
  return result;
}

function addNotice(notices, source, text) {
  const content = text.replace(/\r\n?/g, "\n").replace(/[\t ]+$/gm, "").trimEnd();
  if (!content) return;

  const sources = notices.get(content) ?? [];
  sources.push(source);
  notices.set(content, sources);
}

const lockfile = await readFile(lockfilePath, "utf8");
const packages = lockedPackages(lockfile);
const packageLicenses = [];
const notices = new Map();
const manifestLicenses = [];
const errors = [];

await mkdir(cacheDirectory, { recursive: true });
console.log(`Reading licenses for ${packages.length} locked packages.`);

for (let offset = 0; offset < packages.length; offset += downloadConcurrency) {
  const batch = packages.slice(offset, offset + downloadConcurrency);
  const results = await Promise.allSettled(batch.map(readPackage));

  for (const [index, result] of results.entries()) {
    const { name, version } = batch[index];
    const label = `${name}@${version}`;

    if (result.status === "rejected") {
      errors.push(`${label} — ${result.reason.message}`);
      continue;
    }

    const license = typeof result.value.license === "string" ? result.value.license : result.value.license?.type;
    if (!license || license === "Unknown") {
      errors.push(`${label} — the published package has no license identifier.`);
      continue;
    }

    packageLicenses.push({ name, version, license });
    if (result.value.notices.length === 0) {
      manifestLicenses.push(`${label} — ${license}`);
    }
    for (const [path, content] of result.value.notices) {
      addNotice(notices, `${label} (${path.replace(/^[^/]+\//, "")})`, content);
    }
  }
}

if (errors.length > 0) {
  throw new Error(`Could not verify ${errors.length} package licenses:\n${errors.join("\n")}`);
}

const assetLicenses = [];
for (const { name, license, author, file } of assets) {
  assetLicenses.push({ name, license, author });
  const notice = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
  addNotice(notices, `${name} (${file})`, notice);
}

const catalog = JSON.stringify({ packages: packageLicenses, assets: assetLicenses }, null, 2);
const noticeBlocks = [...notices].map(([content, sources]) => `${sources.join("\n")}\n\n${content}`);
if (manifestLicenses.length > 0) {
  noticeBlocks.push(`License declarations from published package manifests\n\n${manifestLicenses.join("\n")}`);
}
const separator = `\n\n${"=".repeat(72)}\n\n`;
const noticeFile = `Taplify Third-Party Notices\n\n${noticeBlocks.join(separator)}\n`;

if (await readFile(lockfilePath, "utf8") !== lockfile) {
  throw new Error("The lockfile changed while collecting licenses. Run the command again.");
}

await mkdir(new URL(".", catalogPath), { recursive: true });
await mkdir(new URL(".", noticesPath), { recursive: true });
await replaceFile(catalogPath, `${catalog}\n`);
await replaceFile(noticesPath, noticeFile);
console.log(`Wrote ${packageLicenses.length} package licenses and ${notices.size} distinct notices.`);
