// Script to check all boolean props in the codebase
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const srcDir = path.join(__dirname, 'src');

// Find all TSX files
const files = glob.sync('**/*.tsx', { cwd: srcDir });

const booleanProps = [
  'enabled', 'disabled', 'visible', 'hidden', 'checked', 'selected',
  'required', 'readonly', 'loading', 'multiline', 'secureTextEntry',
  'autoCapitalize', 'autoCorrect', 'headerShown', 'gestureEnabled',
  'animationEnabled', 'transparent', 'inverted', 'refreshing',
  'scrollEnabled', 'cancellable', 'cancelable', 'bounces',
  'showsVerticalScrollIndicator', 'showsHorizontalScrollIndicator',
  'editable', 'selectTextOnFocus', 'clearButtonMode', 'keyboardType',
  'returnKeyType', 'isDarkMode', 'isActive', 'isFocused', 'isSelected'
];

const issues = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for string boolean values
    const stringBooleanPattern = /\b(true|false)\s*[:=]\s*["']|["']\s*[:=]\s*(true|false)\b/;
    if (stringBooleanPattern.test(line)) {
      issues.push({
        file,
        line: index + 1,
        content: line.trim(),
        issue: 'String boolean value found (should be true/false without quotes)'
      });
    }

    // Check for boolean props that might be strings
    booleanProps.forEach(prop => {
      const propPattern = new RegExp(`\\b${prop}\\s*[=:]\\s*["']`, 'i');
      if (propPattern.test(line)) {
        issues.push({
          file,
          line: index + 1,
          content: line.trim(),
          issue: `Boolean prop '${prop}' might be receiving string value`
        });
      }
    });
  });
});

console.log('=== Boolean Props Check Results ===\n');
if (issues.length === 0) {
  console.log('✅ No issues found!');
} else {
  console.log(`Found ${issues.length} potential issues:\n`);
  issues.forEach(issue => {
    console.log(`File: ${issue.file}`);
    console.log(`Line: ${issue.line}`);
    console.log(`Issue: ${issue.issue}`);
    console.log(`Code: ${issue.content}`);
    console.log('---');
  });
}

