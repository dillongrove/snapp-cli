const fs = require('fs');
let {
  project,
  step,
  setProjectName,
  replaceInFile,
  titleCase,
  kebabCase,
} = require('./project');

describe('project.js', () => {
  describe('project()', () => {
    it.todo('should be tested');
  });

  describe('step()', () => {
    it.todo('should be tested');
  });

  describe('setProjectName()', () => {
    it('README.md contains target text to replace', () => {
      const readmeJs = fs.readFileSync('templates/project/README.md');
      expect(readmeJs.includes('Mina SNAPP: PROJECT_NAME')).toBeTruthy();
      const readmeTs = fs.readFileSync('templates/project-ts/README.md');
      expect(readmeTs.includes('Mina SNAPP: PROJECT_NAME')).toBeTruthy();
    });

    it('package.json contains target text to replace', () => {
      const readmeJs = fs.readFileSync('templates/project/package.json');
      expect(readmeJs.includes('package-name')).toBeTruthy();
      const readmeTs = fs.readFileSync('templates/project-ts/package.json');
      expect(readmeTs.includes('package-name')).toBeTruthy();
    });

    it('should replace text in README.md & package.json', () => {
      const DIR = 'temp-fixture-proj';
      const README = '# Mina Snapps: PROJECT_NAME\n more stuff\n and more';
      const PKG = `{"name": "package-name","version": "0.1.0"}`;
      fs.mkdirSync('temp-fixture-proj', { recursive: true });
      fs.writeFileSync(DIR + '/README.md', README);
      fs.writeFileSync(DIR + '/package.json', PKG);
      setProjectName(DIR);
      const readmeAfter = fs.readFileSync(DIR + '/README.md', 'utf8');
      expect(readmeAfter.includes('Temp Fixture Proj')).toBeTruthy();
      expect(readmeAfter.includes('PROJECT_NAME')).toBeFalsy();
      const packageAfter = fs.readFileSync(DIR + '/package.json', 'utf8');
      expect(packageAfter.includes('temp-fixture-proj')).toBeTruthy();
      expect(packageAfter.includes('package-name')).toBeFalsy();
      fs.rmSync(DIR, { recursive: true });
    });
  });

  describe('replaceInFile()', () => {
    it('should replace target content in a file', () => {
      const file = 'tmp-fixture-file';
      const str = '# Mina Snapps: PROJECT_NAME\n more stuff';
      fs.writeFileSync(file, str);
      replaceInFile(file, 'PROJECT_NAME', 'Foo Bar');
      const result = fs.readFileSync(file, 'utf8');
      expect(result.includes('Foo Bar')).toBeTruthy();
      expect(result.includes('PROJECT_NAME')).toBeFalsy();
      fs.unlinkSync(file);
    });
  });

  describe('titleCase()', () => {
    it('should return text as Title Case', () => {
      expect(titleCase('project-name')).toEqual('Project Name');
    });
  });

  describe('kebabCase()', () => {
    it('should return text as kebab-case', () => {
      expect(kebabCase('Project name')).toEqual('project-name');
    });
  });
});
