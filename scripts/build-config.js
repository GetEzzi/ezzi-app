#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get product name from environment variable or use default
const productName = process.env.PRODUCT_NAME || 'Ezzi';

// Create a safe filename version (replace spaces with hyphens, remove special chars)
const safeProductName = productName
  .replace(/[^a-zA-Z0-9\s-]/g, '')
  .replace(/\s+/g, '-');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Update build configuration
packageJson.build.productName = productName;

// Update artifact names for all platforms
packageJson.build.mac.artifactName = `${safeProductName}-Mac-\${arch}-\${version}.\${ext}`;
packageJson.build.win.artifactName = `${safeProductName}-Windows-\${version}.\${ext}`;
packageJson.build.linux.artifactName = `${safeProductName}-Linux-\${version}.\${ext}`;

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✓ Build configuration updated for product: "${productName}"`);
console.log(`✓ Artifact names will use: "${safeProductName}"`);
