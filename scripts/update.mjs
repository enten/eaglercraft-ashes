#!/usr/bin/env zx

await cd(path.resolve(__dirname, '..'));

const [
  bundlesFile = path.join(__dirname, 'bundles.txt'),
] = argv._;

const bundlesTxt = await fs.readFile(bundlesFile, 'utf-8');
const bundlesLines = bundlesTxt.split(/\r?\n/)
  .filter(line => line.trim().length && line.trimStart()[0] !== '#');

const bundles = bundlesLines.map(bundleTxtLine => {
  const [repoUrl, repoBranch = 'main'] = bundleTxtLine.split(' ', 2);
  const repoName = path.basename(repoUrl);
  const repoGroup = path.basename(path.dirname(repoUrl));
  const repoId = `${repoGroup}/${repoName}`;
  const repoDir = path.posix.join('remotes', repoGroup, repoName);
  const bundleName = `${repoGroup}--${repoName}`;
  const bundleDir = path.posix.join('bundles', repoGroup, repoName);
  const bundleFile = path.posix.join(bundleDir, bundleName) + '.bundle';
  const verifyFile = bundleFile + '.verify';
  const revisionFile = bundleFile + '.rev';

  return {
    repoUrl,
    repoBranch,
    repoName,
    repoGroup,
    repoId,
    repoDir,
    bundleName,
    bundleDir,
    bundleFile,
    verifyFile,
    revisionFile,
  };
});

console.log(bundles);

for (const bundle of bundles) {
  const { repoUrl, repoBranch, repoId, repoDir, bundleFile, verifyFile, revisionFile } = bundle;

  await $`zx scripts/bundle-update.mjs ${repoUrl} ${repoBranch} ${repoDir} ${bundleFile} ${verifyFile} ${revisionFile}`;

  const bundleCommitId = await $`cat ${revisionFile} | grep "commit " | cut -d' ' -f2`
    .then(({ stdout }) => stdout.trim());

  if (argv.commit) {
    await $`git add ${[verifyFile, revisionFile]}`;
    await $`git diff-index --quiet HEAD || git commit -m "update ${repoId} ${bundleCommitId.slice(0, 7)}"`;
  }
}

const revisionFiles = await glob('**/*.rev', { cwd: path.resolve(__dirname, '..') });

await $`zx scripts/readme-render.mjs ${revisionFiles} > README.md`;

if (argv.commit) {
  await $`git add README.md`;
  await $`git diff-index --quiet HEAD || git commit -m "update README.md"`;
}