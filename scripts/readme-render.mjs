#!/usr/bin/env zx

const CLI_NAME = path.basename(__filename);
const CLI_USAGE = `[revision-file...] [--base-link]`;
const CLI_HELP = `Usage: ${CLI_NAME} ${CLI_USAGE}`;
 
const cliMissingArg = CLI_USAGE.replaceAll(/\s*\[[^\]]+\]/g, '').split(/\s+/)[argv._.length];

if (cliMissingArg) {
  console.error(`${CLI_HELP}\n\n${CLI_NAME}: missing argument '${cliMissingArg}'`);
  process.exit(1);  
}

const GH_USER_CONTENT_BASE_URL = 'https://media.githubusercontent.com/media/enten/eaglercraft-ashes/main';

const MAP_OF_VERSIONS = {
  'Eaglercraft 22w43a (Minecraft 1.5.2)': ['eaglerarchive/eaglercraft1.5.2-final', 'ekoerp1/eaglercraft-1.15-Final-Release'],
  'EaglercraftX u17 (Minecraft 1.8)': ['eaglerarchive/eaglercraftx-1.8'],
  'Eaglercraft 21m12-24 (Minecraft 1.5.2)': ['ekoerp1/eaglecraft'],
};

const [...revisionFiles] = argv._;
const { baseLink = '.' } = argv;

const tableRows = [];
const linkRefs = [];

for (const revisionFile of revisionFiles) {
  const revisionRaw = await fs.readFile(revisionFile, 'utf-8');
  const revisionLines = revisionRaw.split(/\r?\n/);
  const bundleFile = revisionLines.find(line => line.startsWith('bundle '))?.slice('bundle '.length);
  const bundleRemoteUrl = revisionLines.find(line => line.startsWith('remote '))?.slice('remote '.length)
  const bundleCommitId = revisionLines.find(line => line.startsWith('commit '))?.slice('commit '.length)

  if (!bundleFile) {
    console.error(`${CLI_NAME}: 'bundle' field is missing in next revision file: ${revisionFile}`);
    continue;
  }

  const revisionFileName = path.basename(revisionFile);
  const bundleFileName = path.basename(bundleFile);

  const revisionFileAbsolute = path.posix.resolve(revisionFile);
  const bundleFileAbsolute = path.posix.resolve(path.dirname(revisionFileAbsolute), bundleFile);

  const relativeFromCwdToBundleFile = path.posix.relative('.', bundleFileAbsolute);
  const relativeFromCwdToRevisionFile = path.posix.relative('.', revisionFileAbsolute);

  let bundleId = bundleFileName;
  let eaglercraftVersion = '';

  if (bundleRemoteUrl) {
    const repoName = path.basename(bundleRemoteUrl);
    const repoGroup = path.basename(path.dirname(bundleRemoteUrl))

    bundleId = `${repoGroup}/${repoName}`

    eaglercraftVersion = Object.keys(MAP_OF_VERSIONS)
      .find(version => MAP_OF_VERSIONS[version].includes(bundleId));
  }

  tableRows.push(`| [${bundleId}][${bundleFileName}] \
| [${bundleCommitId.slice(0, 7)}][${revisionFileName}] \
| ${eaglercraftVersion} \
| [⏬ Download][${bundleFileName}:download] |`);

  linkRefs.push(
    `[${bundleFileName}]: ${baseLink}/${relativeFromCwdToBundleFile}`,
    `[${revisionFileName}]: ${baseLink}/${relativeFromCwdToRevisionFile}`,
    `[${bundleFileName}:download]: ${GH_USER_CONTENT_BASE_URL}/${relativeFromCwdToBundleFile}`,
  );
}

const readmemd = `# Eaglercraft Ashes

[Git bundles](https://git-scm.com/book/en/v2/Git-Tools-Bundling) of [Eaglercraft repositories](./scripts/bundles.txt) for archival purposes due to [DMCA takedown](https://github.com/github/dmca/blob/master/2023/02/2023-02-22-mojang.md) ([more info](https://torrentfreak.com/mojang-targets-repositories-of-browser-based-minecraft-copy-eaglercraft-230224/)).

| Repository | Revision | Description | |
|-|-|-|-|
${tableRows.join('\n')}

_This code is released in to the public domain, and [UNLICENSED](https://unlicense.org/)._



${linkRefs.join('\n')}`;

console.log(readmemd);
