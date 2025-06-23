const fs = require('fs');
const path = require('path');
const glob = require('glob');
const packageJson = require('./package.json');

// Read config.xml 
const configFilePath = path.join(__dirname, 'config.xml'); 
const versionTxtFilePath = path.join(__dirname, 'www', 'version.txt'); 
const versionCodeTxtFilePath = path.join(__dirname, 'www', 'versionCode.txt'); 
let configXml = fs.readFileSync(configFilePath, 'utf8');

// Find and replace version in config.xml 
const versionRegex = /<widget[^>]+version="([^"]+)"/; 
const versionMatch = versionRegex.exec(configXml);

if (versionMatch) {
    configXml = configXml.replace(versionMatch[1], packageJson.version);
    // Write the updated config.xml file back
    fs.writeFileSync(configFilePath, configXml, 'utf8');
} else { 
    console.error('Could not find version tag in config.xml'); 
}

fs.writeFileSync(versionTxtFilePath, packageJson.version.toString(), 'utf8');
fs.writeFileSync(versionCodeTxtFilePath, packageJson.versionCode.toString(), 'utf8');

// Get all changelog .txt files in fastlane structure
const changelog_files = glob.sync('fastlane/metadata/android/*/changelog/' + packageJson.versionCode + '.txt');
const destDir = path.join('www', 'changelog');

// Ensure destination directory exists
fs.mkdirSync(destDir, { recursive: true });

changelog_files.forEach(file => {
  // Extract language and file name
  const parts = file.split(path.sep);
  const lang = parts[3]; // e.g., 'en-US'
  const filename = lang + ".txt"

  const destPath = path.join(destDir, filename);

  // Copy file
  fs.copyFileSync(file, destPath);

  console.log(`Copied ${file} → ${destPath}`);
});

// Get all changelog .txt files in fastlane structure
const design_files = glob.sync('www/img/gui/*.svg');
const design_list_destDir = path.join('www', 'img', 'gui', 'list.json');
const design_list = []

design_files.forEach(file => {
  design_list.push(file.split(path.sep)[3].split(".")[0])
});

fs.writeFileSync(design_list_destDir, JSON.stringify(design_list), 'utf8');