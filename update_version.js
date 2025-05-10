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
const files = glob.sync('fastlane/metadata/android/*/changelog/' + packageJson.versionCode + '.txt');

files.forEach(file => {
  // Extract language and file name
  const parts = file.split(path.sep);
  const lang = parts[3]; // e.g., 'en-US'
  const filename = lang + ".txt"

  const destDir = path.join('www', 'changelog');
  const destPath = path.join(destDir, filename);

  // Ensure destination directory exists
  fs.mkdirSync(destDir, { recursive: true });

  // Copy file
  fs.copyFileSync(file, destPath);

  console.log(`Copied ${file} → ${destPath}`);
});