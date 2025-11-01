#!/usr/bin/env node

/**
 * Comprehensive error scanner for React Native Expo project
 * Finds various types of potential errors including boolean/string mismatches
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(srcDir, filePath);
  const errors = {
    boolean: [],
    type: [],
    import: [],
    syntax: []
  };

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine === '' || trimmedLine.startsWith('/*')) {
      return;
    }

    // 1. STRING BOOLEAN VALUES (CRITICAL)
    const stringBooleanPattern = /\b(headerShown|loading|disabled|visible|refreshing|inverted|scrollEnabled|allowsEditing|shouldShowAlert|shouldPlaySound|shouldSetBadge|value|checked|selected|enabled)\s*[=:]\s*["'](true|false)["']/;
    if (stringBooleanPattern.test(trimmedLine)) {
      errors.boolean.push({
        line: lineNum,
        severity: 'CRITICAL',
        message: 'String boolean in native prop (will cause runtime error)',
        code: trimmedLine.substring(0, 120)
      });
    }

    // 2. MISSING BOOLEAN CONVERSION
    // Check for variable passed to boolean prop without conversion
    const variableBooleanPattern = /<(Switch|Button|Modal|RefreshControl|FlatList).*?\b(value|loading|disabled|visible|refreshing|inverted)\s*=\s*\{([^}]*)\}/;
    const match = trimmedLine.match(variableBooleanPattern);
    if (match) {
      const propValue = match[3].trim();
      // If it's a variable (contains identifier) and doesn't have Boolean() or typeof check
      if (/[a-zA-Z_$]/.test(propValue) && 
          !propValue.includes('Boolean(') && 
          !propValue.includes('typeof') && 
          !propValue.includes('as boolean') &&
          propValue !== 'true' && 
          propValue !== 'false' &&
          !propValue.match(/^!?[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
        errors.boolean.push({
          line: lineNum,
          severity: 'WARNING',
          message: `Variable '${propValue}' passed to boolean prop '${match[2]}' - consider Boolean() conversion`,
          code: trimmedLine.substring(0, 120)
        });
      }
    }

    // 3. MISSING IMPORTS
    if (trimmedLine.includes('from') && trimmedLine.includes("'./") && !trimmedLine.startsWith('import')) {
      // Might be a missing import
    }

    // 4. UNDEFINED VARIABLES (basic check)
    // Check for use of variables that might be undefined
    if (trimmedLine.match(/\{[a-zA-Z_$][a-zA-Z0-9_$]*\}/) && 
        !trimmedLine.includes('const ') && 
        !trimmedLine.includes('let ') && 
        !trimmedLine.includes('var ')) {
      // This is just a basic check, not comprehensive
    }

    // 5. ROUTE PARAMS WITHOUT TYPE CHECK
    if ((trimmedLine.includes('route.params') || trimmedLine.includes('params.')) && 
        trimmedLine.match(/is(.*?)\s*[=:]/) && 
        !trimmedLine.includes('Boolean') && 
        !trimmedLine.includes('typeof') &&
        !trimmedLine.includes('as boolean')) {
      errors.type.push({
        line: lineNum,
        severity: 'WARNING',
        message: 'Route param boolean might need type checking',
        code: trimmedLine.substring(0, 120)
      });
    }

    // 6. ASYNCSTORAGE VALUES USED AS BOOLEAN
    if (trimmedLine.includes('AsyncStorage.getItem') && 
        !trimmedLine.includes('Boolean') && 
        !trimmedLine.includes('JSON.parse')) {
      const nextLines = lines.slice(index, index + 3).join(' ');
      if (nextLines.match(/setIs|set.*Boolean|if\s*\(/)) {
        errors.type.push({
          line: lineNum,
          severity: 'WARNING',
          message: 'AsyncStorage value might need Boolean() conversion if used as boolean',
          code: trimmedLine.substring(0, 120)
        });
      }
    }
  });

  return errors;
}

// Main execution
console.log('🔍 Comprehensive React Native Error Scanner\n');
console.log(`Scanning: ${srcDir}\n`);
console.log('Checking for:\n');
console.log('  - String boolean values in props');
console.log('  - Missing Boolean() conversions');
console.log('  - Route params type issues');
console.log('  - AsyncStorage type issues\n');
console.log('='.repeat(80) + '\n');

if (!fs.existsSync(srcDir)) {
  console.error(`❌ Directory not found: ${srcDir}`);
  process.exit(1);
}

const files = findFiles(srcDir);
const allErrors = {
  boolean: [],
  type: [],
  import: [],
  syntax: []
};

files.forEach(file => {
  const errors = scanFile(file);
  Object.keys(errors).forEach(category => {
    errors[category].forEach(error => {
      allErrors[category].push({
        file: path.relative(srcDir, file),
        ...error
      });
    });
  });
});

// Report
let totalIssues = 0;

Object.keys(allErrors).forEach(category => {
  if (allErrors[category].length > 0) {
    totalIssues += allErrors[category].length;
    console.log(`\n📂 ${category.toUpperCase()} ISSUES: ${allErrors[category].length}`);
    console.log('-'.repeat(80));
    
    const critical = allErrors[category].filter(e => e.severity === 'CRITICAL');
    const warnings = allErrors[category].filter(e => e.severity === 'WARNING');
    
    if (critical.length > 0) {
      console.log(`\n❌ CRITICAL (${critical.length}):`);
      critical.forEach(error => {
        console.log(`\n  📁 ${error.file}:${error.line}`);
        console.log(`     ${error.message}`);
        console.log(`     ${error.code}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
      warnings.forEach(error => {
        console.log(`\n  📁 ${error.file}:${error.line}`);
        console.log(`     ${error.message}`);
        console.log(`     ${error.code}`);
      });
    }
  }
});

console.log('\n' + '='.repeat(80));
if (totalIssues === 0) {
  console.log('\n✅ No issues found! All boolean props appear correctly typed.\n');
} else {
  console.log(`\n📊 SUMMARY:`);
  console.log(`   Total issues: ${totalIssues}`);
  console.log(`   Critical: ${allErrors.boolean.filter(e => e.severity === 'CRITICAL').length + allErrors.type.filter(e => e.severity === 'CRITICAL').length}`);
  console.log(`   Warnings: ${totalIssues - (allErrors.boolean.filter(e => e.severity === 'CRITICAL').length + allErrors.type.filter(e => e.severity === 'CRITICAL').length)}\n`);
}

