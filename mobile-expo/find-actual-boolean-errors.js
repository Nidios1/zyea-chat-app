#!/usr/bin/env node

/**
 * Advanced script to find ACTUAL boolean/string type mismatch errors
 * Focuses on props that are passed to native modules
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Native module boolean props that MUST be boolean, not string
const STRICT_BOOLEAN_PROPS = {
  // React Navigation
  'headerShown': ['Stack.Screen', 'Tab.Screen', 'Navigation все'],
  'gestureEnabled': ['Navigation'],
  'animationEnabled': ['Navigation'],
  
  // React Native Core
  'loading': ['Button', 'ActivityIndicator'],
  'disabled': ['Button', 'TouchableOpacity', 'Pressable'],
  'visible': ['Modal', 'View'],
  'refreshing': ['RefreshControl'],
  'inverted': ['FlatList'],
  'scrollEnabled': ['ScrollView', 'FlatList'],
  'multiline': ['TextInput'],
  'secureTextEntry': ['TextInput'],
  'autoCorrect': ['TextInput'],
  'editable': ['TextInput'],
  
  // Image Picker
  'allowsEditing': ['ImagePicker'],
  'allowsMultipleSelection': ['ImagePicker'],
  
  // Notifications
  'shouldShowAlert': ['Notifications'],
  'shouldPlaySound': ['Notifications'],
  'shouldSetBadge': ['Notifications'],
  
  // Switch
  'value': ['Switch'], // when used with Switch component
};

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

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(srcDir, filePath);
  const issues = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();
    
    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine === '' || trimmedLine.startsWith('/*')) {
      return;
    }

    // Check for ACTUAL string boolean values (not comparisons)
    // Pattern: prop="true" or prop={"true"} or prop='true'
    const stringBooleanPropPattern = /\b(headerShown|loading|disabled|visible|refreshing|inverted|scrollEnabled|multiline|secureTextEntry|autoCorrect|editable|allowsEditing|allowsMultipleSelection|shouldShowAlert|shouldPlaySound|shouldSetBadge|shouldShowBanner|shouldShowList|enabled|checked|selected)\s*[=:]\s*["'](true|false)["']/;
    
    if (stringBooleanPropPattern.test(trimmedLine)) {
      issues.push({
        line: lineNum,
        type: 'CRITICAL',
        message: 'String boolean value in prop (native module will reject this)',
        code: trimmedLine.substring(0, 100)
      });
    }

    // Check for template literals that might be string booleans
    const templateBooleanPattern = /\$\{.*\?.*["'](true|false)["'].*:.*["'](true|false)["'].*\}/;
    if (templateBooleanPattern.test(trimmedLine)) {
      issues.push({
        line: lineNum,
        type: 'WARNING',
        message: 'Template literal might return string boolean',
        code: trimmedLine.substring(0, 100)
      });
    }

    // Check for Switch value without Boolean conversion if from variable
    if (trimmedLine.includes('<Switch') && trimmedLine.includes('value={')) {
      const valueMatch = trimmedLine.match(/value=\{([^}]+)\}/);
      if (valueMatch) {
        const valueExpr = valueMatch[1].trim();
        // If it's a variable (not literal true/false) and doesn't have Boolean()
        if (!valueExpr.match(/^(true|false)$/) && !valueExpr.includes('Boolean(') && !valueExpr.includes('as boolean')) {
          issues.push({
            line: lineNum,
            type: 'WARNING',
            message: 'Switch value from variable might need Boolean() conversion',
            code: trimmedLine.substring(0, 100)
          });
        }
      }
    }

    // Check for route.params boolean usage without conversion
    if (trimmedLine.includes('route.params') || trimmedLine.includes('params.')) {
      const boolParamMatch = trimmedLine.match(/(isVideo|isEnabled|isActive|isSelected|isFocused|isDark|isAuthenticated)\s*[:=]/);
      if (boolParamMatch && !trimmedLine.includes('Boolean') && !trimmedLine.includes('typeof') && !trimmedLine.includes('as boolean')) {
        issues.push({
          line: lineNum,
          type: 'WARNING',
          message: `Route param '${boolParamMatch[1]}' might need type conversion`,
          code: trimmedLine.substring(0, 100)
        });
      }
    }
  });

  return issues;
}

// Main execution
console.log('🔍 Scanning for ACTUAL boolean/string type errors...\n');
console.log(`Directory: ${srcDir}\n`);

if (!fs.existsSync(srcDir)) {
  console.error(`❌ Directory not found: ${srcDir}`);
  process.exit(1);
}

const files = findFiles(srcDir);
console.log(`Found ${files.length} files\n`);

const criticalIssues = [];
const warnings = [];

files.forEach(file => {
  const issues = checkFile(file);
  issues.forEach(issue => {
    if (issue.type === 'CRITICAL') {
      criticalIssues.push({
        file: path.relative(srcDir, file),
        ...issue
      });
    } else {
      warnings.push({
        file: path.relative(srcDir, file),
        ...issue
      });
    }
  });
});

console.log('='.repeat(80));
console.log('📊 RESULTS\n');

if (criticalIssues.length === 0 && warnings.length === 0) {
  console.log('✅ No boolean/string type issues found!\n');
  console.log('All boolean props appear to be correctly typed.');
} else {
  if (criticalIssues.length > 0) {
    console.log(`❌ CRITICAL ISSUES: ${criticalIssues.length}\n`);
    criticalIssues.forEach(issue => {
      console.log(`📁 ${issue.file}:${issue.line}`);
      console.log(`   ${issue.message}`);
      console.log(`   ${issue.code}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS: ${warnings.length}\n`);
    warnings.forEach(issue => {
      console.log(`📁 ${issue.file}:${issue.line}`);
      console.log(`   ${issue.message}`);
      console.log(`   ${issue.code}\n`);
    });
  }
  
  console.log('='.repeat(80));
}

console.log('\n✅ Scan complete!\n');

