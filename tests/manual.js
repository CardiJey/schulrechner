/*
Total Workflow of using the Schulrechner:

UI loads -> pointer_events assigned to keys -> 
pointerdown event on key -> key input_code sent to handle function of input_handler -> input_handler builds math.js string -> 
math.js evaluates string -> input_handler creates rendered_input and rendered_output -> set as innerHTML of display elements ->
CSS styles input and results

What does this test test?
This only tests UI functionality by just iterating over the manual checklist at manual_test_results.csv
*/

const fs = require('fs');
const path = require('path');
const { test, describe } = require('node:test');
const assert = require('node:assert');

// Get versionCode
const packageJsonPath = path.resolve('package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const versionCode = String(packageJson.versionCode);

// Load CSV
const csvPath = path.resolve('tests','manual_test_results.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8').trim();

// Parse CSV
const [headerLine, ...dataLines] = csvContent.split('\n');
const headers = headerLine.split(',').map(h => h.trim());
const versionIndex = headers.indexOf('versionCode');

// Find the row for the current versionCode
const row = dataLines.find(line => {
    const cols = line.split(',');
    return cols[versionIndex] === versionCode;
});

describe(`🧪 Manual UI Tests for version ${versionCode}`, () => {
    if (!row) {
        for (let i = 0; i < headers.length; i++) {
            const testName = headers[i];
            test.skip(`${testName} (no result or unknown value)`, () => { });
        }
    } else {
        const values = row.split(',');
        
        for (let i = 0; i < headers.length; i++) {
            if (i === versionIndex) continue; // skip versionCode column

            const testName = headers[i];
            const result = values[i]?.trim().toLowerCase();

            switch (result) {
                case 'y':
                    test(`${testName}`, () => {
                        assert.ok(true, 'Manually verified');
                    });
                    break;
                case 'n':
                    test(`${testName}`, () => {
                        assert.fail(`❌ Manual test "${testName}" failed for version ${versionCode}`);
                    });
                    break;
                case 'todo':
                    test.todo(`${testName} (todo)`);
                    break;
                default:
                    test.skip(`${testName} (no result or unknown value)`, () => { });
            }
        }
    }
});
