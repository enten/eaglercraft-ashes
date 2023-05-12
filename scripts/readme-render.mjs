#!/usr/bin/env zx

const CLI_NAME = path.basename(__filename);
const CLI_USAGE = `[revision-file...] [--base-link]`;
const CLI_HELP = `Usage: ${CLI_NAME} ${CLI_USAGE}`;
 
const cliMissingArg = CLI_USAGE.replaceAll(/\s*\[[^\]]+\]/g, '').split(/\s+/)[argv._.length];

if (cliMissingArg) {
  console.error(`${CLI_HELP}\n\n${CLI_NAME}: missing argument '${cliMissingArg}'`);
  process.exit(1);  
}

const MAP_OF_VERSIONS = {
  'Eaglercraft 22w43a (Minecraft 1.5.2)': ['eaglerarchive/eaglercraft1.5.2-final', 'ekoerp1/eaglercraft-1.15-Final-Release'],
  'EaglercraftX u17 (Minecraft 1.8)': ['eaglerarchive/eaglercraftx-1.8'],
  'Eaglercraft 21m12-24 (Minecraft 1.5.2)': ['ekoerp1/eaglecraft'],
};

const MAP_OF_BUNDLE_DOWNLOAD_URLS = {
  'eaglerarchive/eaglercraft1.5.2-final': 'https://download1509.mediafire.com/v8auquehqxvgPpckH20FZsX9vTL62PuVC4ymhqw-hq0-za_USE6hBVUS3Q0XUlJHMzzl86RwFQaIuTHImmwsnzA8VhcNtwc9FHvwbdYXGl8HLj1kXZcERr2Gt0H3eDUWjiyyJV8M6-ACenG0AL0xg61Oq2ADCd8s6Q5oawEF35_7/blfzzv650rbjjvz/eaglerarchive--eaglercraft1.5.2-final.bundle',
  'eaglerarchive/eaglercraftx-1.8': 'https://download1477.mediafire.com/s8647n51kifg8wjzMaJIOeFb9xnrkaFKHaiIfVUtA2Rx8dEjeuhrtKgV1NnPdwXVSns0zotsOJXvYoS_38FWLM7LwUWl-6x6SC5FpcnZSSOoCGeWo_v4xfopI0rh3WfRkcW4LacGejZCQ50URobiOpo3F5luwzZ1eVd5Y_TEl3M0/r5o5ke0v57cw8yd/eaglerarchive--eaglercraftx-1.8.bundle',
  'ekoerp1/eaglecraft': 'https://download944.mediafire.com/l7ru7u6yhz9gMX83EWPrZC-Ml8z43tLTSOiQyqFbnk8oWURtDcBeSAiMBnB50OdCCOU7F1FxR8Ae391WRDWG4brBEK0bG84ceE1H-VV5xE1dU6frlTvek3o0W7yAtCSGZ3tHo5vY0OdFVkuJOt9__m74NjRdicFZGMGHy5fhIxsd/22s208jb86g3j55/ekoerp1--eaglecraft.bundle',
  'ekoerp1/eaglercraft-1.15-Final-Release': 'https://download1585.mediafire.com/qqbm9xx47mdgAxghZ3WPE5v7CSGWAz7HlSd-b-zI8VRI4ZSLEL6aXWif1jfVoph9OEWzfZwjtpsqbODYoJaQaw8ssw88FSxPyxIRboI6Te6vEJYxulYbM4XYo4FrKYMGArAKl62w7PtORbRZsAuzwFUeSUhiv7Lseektxf2JWN4Q/unh0d5zh8ovg1v6/ekoerp1--eaglercraft-1.15-Final-Release.bundle',
};

const revisionFiles = [...argv._].sort();
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
  const bundleFileName = path.basename(bundleFile, '.bundle');

  const revisionFileAbsolute = path.posix.resolve(revisionFile);
  const relativeFromCwdToRevisionFile = path.posix.relative('.', revisionFileAbsolute);

  let bundleId = bundleFileName;
  let eaglercraftVersion = '';
  let bundleDownloadUrl = '';

  if (bundleRemoteUrl) {
    const repoName = path.basename(bundleRemoteUrl);
    const repoGroup = path.basename(path.dirname(bundleRemoteUrl))

    bundleId = `${repoGroup}/${repoName}`

    eaglercraftVersion = Object.keys(MAP_OF_VERSIONS)
      .find(version => MAP_OF_VERSIONS[version].includes(bundleId));

    bundleDownloadUrl = MAP_OF_BUNDLE_DOWNLOAD_URLS[bundleId];
  }

  tableRows.push(`| [${bundleId}][${bundleFileName}] \
| [${bundleCommitId.slice(0, 7)}][${revisionFileName}] \
| ${eaglercraftVersion} \
| [⏬ Download][${bundleFileName}:download] |`);

  linkRefs.push(
    `[${bundleFileName}]: ${bundleRemoteUrl}`,
    `[${revisionFileName}]: ${baseLink}/${relativeFromCwdToRevisionFile}`,
    ...(bundleDownloadUrl ? [`[${bundleFileName}:download]: ${bundleDownloadUrl}`] : []),
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
