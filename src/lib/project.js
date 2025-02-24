const chalk = require('chalk');
const fs = require('fs');
const ora = require('ora');
const sh = require('shelljs');
const util = require('util');
const gittar = require('gittar');

const _green = chalk.green;
const _red = chalk.red;
const shExec = util.promisify(sh.exec);

/**
 * Create a new SNAPP project with recommended dir structure, Prettier config,
 * testing lib, etc. Warns if already exists and does NOT overwrite.
 * @param {string} name  Desired dir name or path. Will recursively create
 *                       dirs without overwriting existing content, if needed.
 * @return {void}
 */
async function project(name) {
  const lang = 'ts';

  if (fs.existsSync(name)) {
    console.error(_red(`Directory already exists. Not proceeding`));
    return;
  }

  if (!(await fetchProjectTemplate(name, lang))) return;

  // Set dir for shell commands. Doesn't change user's dir in their CLI.
  sh.cd(name);

  // Git must be initialized before running `npm install` b/c Husky runs an
  // NPM `prepare` script to set up its pre-commit hook within `.git`.
  if (!sh.which('git')) {
    console.error(_red('Please ensure Git is installed, then try again.'));
    return;
  }

  await step('Initialize Git repo', 'git init -q && git branch -m main');

  // `/dev/null` is the only way to silence Husky's install log msg.
  await step('NPM install', 'npm ci --silent > "/dev/null" 2>&1');

  // process.cwd() is full path to user's terminal + path/to/name.
  await setProjectName(process.cwd());

  // `-n` (no verify) skips Husky's pre-commit hooks.
  await step(
    'Git init commit',
    `git add . && git commit -m 'Init commit' -q -n`
  );

  const str =
    `\nSuccess!\n` +
    `\nNext steps:` +
    `\n  cd ${name}` +
    `\n  git remote add origin <your-repo-url>` +
    `\n  git push -u origin main`;

  console.log(_green(str));
}

/**
 * Fetch project template.
 * @param {string} example Name of the destination dir.
 * @param {string} lang    ts or js
 * @returns {boolean}      True if successful; false if not.
 */
async function fetchProjectTemplate(name, lang) {
  const projectName = lang === 'ts' ? 'project-ts' : 'project';
  const step = 'Fetch project template';
  const spin = ora(`${step}...`).start();

  try {
    const src = 'github:o1-labs/snapp-cli#main';
    await gittar.fetch(src);

    // Note: Extract will overwrite any existing dir's contents. Ensure
    // destination does not exist before this.
    const TEMP = '.gittar-temp-dir';
    await gittar.extract(src, TEMP, {
      filter(path) {
        return path.includes(`templates/${projectName}/`);
      },
    });

    sh.mkdir('-p', name); // create path/to/dir if needed.
    sh.cp('-r', `${TEMP}/templates/${projectName}/.`, name);
    sh.rm('-r', TEMP);
    spin.succeed(_green(step));
    return true;
  } catch (err) {
    spin.fail(step);
    console.error(err);
    return false;
  }
}

/**
 * Helper for any steps that need to call a shell command.
 * @param {string} step Name of step to show user
 * @param {string} cmd  Shell command to execute.
 */
async function step(step, cmd) {
  const spin = ora(`${step}...`).start();
  try {
    await shExec(cmd);
    spin.succeed(_green(step));
  } catch (err) {
    spin.fail(step);
  }
}

/**
 * Step to replace placeholder names in the project with the properly-formatted
 * version of the user-supplied name as specified via `snapp project <name>`
 * @param {string} projDir Full path to terminal dir + path/to/name
 */
async function setProjectName(projDir) {
  const step = 'Set project name';
  const spin = ora(`${step}...`).start();

  const name = projDir.split('/').pop();
  replaceInFile(projDir + '/README.md', 'PROJECT_NAME', titleCase(name));
  replaceInFile(projDir + '/package.json', 'package-name', kebabCase(name));

  spin.succeed(_green(step));
}

/**
 * Helper to replace text in a file.
 * @param {string} file Path to file
 * @param {string} a    Old text.
 * @param {string} b    New text.
 */
function replaceInFile(file, a, b) {
  content = fs.readFileSync(file, 'utf8');
  content = content.replace(a, b);
  fs.writeFileSync(file, content);
}

function titleCase(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())
    .join(' ');
}

function kebabCase(str) {
  return str.toLowerCase().replace(' ', '-');
}

module.exports = {
  project,
  step,
  setProjectName,
  replaceInFile,
  titleCase,
  kebabCase,
};
