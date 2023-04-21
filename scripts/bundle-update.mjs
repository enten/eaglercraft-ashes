#!/usr/bin/env zx

const CLI_NAME = path.basename(__filename);
const CLI_USAGE = `<repo-url> <repo-branch> [repo-dir] [bundle-file] [verify-file] [rev-file]`;
const CLI_HELP = `Usage: ${CLI_NAME} ${CLI_USAGE}
 <repo-url>      The remote repository to clone from
 <repo-branch>   The branch to bundle from the remote repository
 [repo-dir]      The name of a new directory to clone into
 [bundle-file]   Used to create a bundle named file (default '[repo-dir].bundle)')
 [verify-file]   Used to create a verify named file (default '[bundle-file].verify)')
 [rev-file]      Used to create a rev named file (default '[bundle-file].rev)')`;
 
const cliMissingArg = CLI_USAGE.replaceAll(/\s*\[[^\]]+\]/g, '').split(/\s+/)[argv._.length];

if (cliMissingArg) {
  console.error(`${CLI_HELP}\n\n${CLI_NAME}: missing argument '${cliMissingArg}'`);
  process.exit(1);  
}

const [
  repoUrl,
  repoBranch,
  repoDir = path.basename(repoUrl),
  bundleFile = `${repoDir}.bundle`,
  verifyFile = `${bundleFile}.verify`,
  revisionFile = `${bundleFile}.rev`,
] = argv._;

const repoDirAbsolute = path.posix.resolve(repoDir);
const bundleFileAbsolute = path.posix.resolve(bundleFile);
const verifyFileAbsolute = path.posix.resolve(verifyFile);
const revisionFileAbsolute = path.posix.resolve(revisionFile);

const relativeFromRepoDirToBundleFile =
  path.posix.relative(repoDirAbsolute, bundleFileAbsolute);
const relativeFromRepoDirToVerifyFile =
  path.posix.relative(repoDirAbsolute, verifyFileAbsolute);
const relativeFromRepoDirToRevisionFile =
  path.posix.relative(repoDirAbsolute, revisionFileAbsolute);

const relativeFromVerifyFileToBundleFile =
  path.posix.relative(path.dirname(verifyFileAbsolute), bundleFile);
const relativeFromRevisionFileToBundleFile =
  path.posix.relative(path.dirname(revisionFileAbsolute), bundleFile);

await fs.ensureDir(repoDirAbsolute);
await fs.ensureFile(bundleFileAbsolute);
await fs.ensureFile(verifyFileAbsolute);

if (await fs.pathExists(path.join(repoDir, '.git'))) {
  await $`cd ${repoDir} && git checkout ${repoBranch} && git pull --rebase origin ${repoBranch}`;
} else {
  await $`git clone --branch ${repoBranch} -- ${repoUrl} ${repoDir}`;
}

await cd(repoDir)
await $`git bundle create ${relativeFromRepoDirToBundleFile} --all`;
await $`git bundle verify ${relativeFromRepoDirToBundleFile} > ${relativeFromRepoDirToVerifyFile}`;
await $`echo ${relativeFromVerifyFileToBundleFile} is okay >> ${relativeFromRepoDirToVerifyFile}`;
await $`echo bundle ${relativeFromRevisionFileToBundleFile} > ${relativeFromRepoDirToRevisionFile}`
await $`git remote get-url origin | xargs -i echo remote {} >> ${relativeFromRepoDirToRevisionFile}`
await $`echo branch ${repoBranch} >> ${relativeFromRepoDirToRevisionFile}`
await $`git rev-list -n 1 --format=raw ${repoBranch} -- >> ${relativeFromRepoDirToRevisionFile}`
