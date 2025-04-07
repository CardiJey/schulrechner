const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

// Read config.xml 
const configFilePath = path.join(__dirname, 'config.xml'); 
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