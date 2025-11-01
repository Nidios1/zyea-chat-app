#!/usr/bin/env node

/**
 * Script to find all potential boolean/string type mismatch errors
 * in React Native Expo project
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Boolean props that native modules expect
const BOOLEAN_PROPS = [
  'enabled', 'disabled', 'visible', 'hidden', 'checked', 'selected',
  'required', 'readonly', 'loading', 'multiline', 'secureTextEntry',
  'autoCapitalize', 'autoCorrect', 'headerShown', 'gestureEnabled',
  'animationEnabled', 'transparent', 'inverted', 'refreshing',
  'scrollEnabled', 'cancellable', 'cancelable', 'bounces',
  'showsVerticalScrollIndicator', 'showsHorizontalScrollIndicator',
  'editable', 'selectTextOnFocus', 'allowsEditing',
  'allowsMultipleSelection', 'isDarkMode', 'isActive', 'isFocused',
  'isSelected', 'isAuthenticated', 'focused', 'shouldShowAlert',
  'shouldPlaySound', 'shouldSetBadge', 'shouldShowBanner', 'shouldShowList'
];

// Find all TypeScript/JavaScript files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check file for boolean issues
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);
  const issues = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine === '' || trimmedLine.startsWith('/*')) {
      return;
    }

    // 1. Check for string boolean values
    const stringBooleanPattern = /["']\s*(true|false)\s*["']|=\s*["'](true|false)["']|:\s*["'](true|false)["']/;
    if (stringBooleanPattern.test(trimmedLine)) {
      issues.push({
        line: lineNum,
        type: 'STRING_BOOLEAN',
        message: 'String boolean value found (should be true/false without quotes)',
        code: trimmedLine
      });
    }

    // 2. Check for boolean props that might receive strings
    BOOLEAN_PROPS.forEach(prop => {
      // Check for prop="true" or prop="false"
      const stringPropPattern = new RegExp(`\\b${prop}\\s*[=:]\\s*["']`, 'i');
      if (stringPropPattern.test(trimmedLine)) {
        // Make sure it's not in a string comment
        if (!trimmedLine.includes('//') || trimmedLine.indexOf(prop) < trimmedLine.indexOf('//')) {
          issues.push({
            line: lineNum,
            type: 'STRING_PROP',
            message: `Boolean prop '${prop}' might be receiving string value`,
            code: trimmedLine
          });
        }
      }
    });

    // 3. Check for conditional that might return string instead of boolean
    const conditionalPattern = /\?\s*["'](true|false)["']|:\s*["'](true|false)["']/;
    if (conditionalPattern.test(trimmedLine)) {
      issues.push({
        line: lineNum,
        type: 'CONDITIONAL_STRING',
        message: 'Conditional expression returning string boolean',
        code: trimmedLine
      });
    }

    // 4. Check for AsyncStorage.getItem that might be used as boolean
    if (trimmedLine.includes('AsyncStorage.getItem') && !trimmedLine.includes('Boolean') && !trimmedLine.includes('JSON.parse')) {
      const nextLine = lines[index + 1]?.trim() || '';
      if (nextLine.includes('setIs') || nextLine.includes('=') || trimmedLine.includes('setIs')) {
        issues.push({
          line: lineNum,
          type: 'ASYNC_STORAGE',
          message: 'AsyncStorage value might need Boolean() conversion before use as boolean',
          code: trimmedLine
        });
      }
    }

    // 5. Check for route.params that might be string
    if (trimmedLine.includes('route.params') && (trimmedLine.includes('isVideo') || trimmedLine.includes('isEnabled') || trimmedLine.includes('isActive'))) {
      if (!trimmedLine.includes('Boolean') && !trimmedLine.includes('typeof')) {
        issues.push({
          line: lineNum,
          type: 'ROUTE_PARAMS',
          message: 'Route params boolean might need type checking',
          code: trimmedLine
        });
      }
    }
  });

  return issues;
}

// Main execution
console.log('🔍 Scanning React Native project for boolean/string type issues...\n');
console.log(`Scanning directory: ${srcDir}\n`);

if (!fs.existsSync(srcDir)) {
  console.error(`❌ Directory not found: ${srcDir}`);
  process.exit(1);
}

const files = findFiles(srcDir);
console.log(`Found ${files.length} files to check\n`);

const allIssues = [];
files.forEach(file => {
  const issues = checkFile(file);
  if (issues.length > 0) {
    allIssues.push({
      file: path.relative(srcDir, file),
      issues
    });
  }
});

// Report results
console.log('='.repeat(80));
if (allIssues.length === 0) {
  console.log('✅ No potential boolean/string type issues found!');
} else {
  console.log(`⚠️  Found ${allIssues.length} files with potential issues:\n`);
  
  allIssues.forEach(({ file, issues }) => {
    console.log(`\n📁 ${file}`);
    console.log('-'.repeat(80));
    issues.forEach(issue => {
      console.log(`  Line ${issue.line}: [${issue.type}]`);
      console.log(`  ${issue.message}`);
      console.log(`  Code: ${issue.code}`);
      console.log('');
    });
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Total issues: ${allIssues.reduce((sum, f) => sum + f.issues.length, 0)}`);
  console.log(`📁 Files affected: ${allIssues.length}\n`);
}

console.log('✅ Scan complete!\n');

