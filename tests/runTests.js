#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Test suites to run
const testSuites = [
  {
    name: 'Unit Tests - Controllers',
    pattern: 'tests/controllers/*.test.js',
    description: 'Testing individual controller functions'
  },
  {
    name: 'Unit Tests - Models',
    pattern: 'tests/models/*.test.js',
    description: 'Testing model validations and constraints'
  },
  {
    name: 'Integration Tests - API',
    pattern: 'tests/integration/*.test.js',
    description: 'Testing complete API endpoints'
  }
];

// Test configuration
const testConfig = {
  coverage: process.argv.includes('--coverage'),
  watch: process.argv.includes('--watch'),
  verbose: process.argv.includes('--verbose'),
  suite: process.argv.find(arg => arg.startsWith('--suite='))?.split('=')[1]
};

console.log('🧪 Rentaly Backend Test Suite Runner');
console.log('=====================================\n');

// Function to run Jest with specific configuration
function runJest(pattern, options = {}) {
  return new Promise((resolve, reject) => {
    const jestArgs = [];
    
    if (pattern) {
      jestArgs.push(pattern);
    }
    
    if (testConfig.coverage) {
      jestArgs.push('--coverage');
    }
    
    if (testConfig.watch) {
      jestArgs.push('--watch');
    }
    
    if (testConfig.verbose) {
      jestArgs.push('--verbose');
    }
    
    // Add additional options
    if (options.detectOpenHandles) {
      jestArgs.push('--detectOpenHandles');
    }
    
    if (options.forceExit) {
      jestArgs.push('--forceExit');
    }

    console.log(`Running: npx jest ${jestArgs.join(' ')}\n`);
    
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });
    
    jest.on('error', (error) => {
      reject(error);
    });
  });
}

// Function to run specific test suite
async function runTestSuite(suite) {
  console.log(`📋 ${suite.name}`);
  console.log(`   ${suite.description}`);
  console.log(`   Pattern: ${suite.pattern}\n`);
  
  try {
    await runJest(suite.pattern, { 
      detectOpenHandles: true, 
      forceExit: true 
    });
    console.log(`✅ ${suite.name} - PASSED\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${suite.name} - FAILED\n`);
    console.error(error.message);
    return false;
  }
}

// Function to run all test suites
async function runAllTests() {
  console.log('🚀 Running All Test Suites\n');
  
  const results = [];
  
  for (const suite of testSuites) {
    const success = await runTestSuite(suite);
    results.push({ suite: suite.name, success });
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${result.suite}`);
  });
  
  console.log(`\nTotal: ${passed}/${total} test suites passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Function to run specific suite
async function runSpecificSuite(suiteName) {
  const suite = testSuites.find(s => 
    s.name.toLowerCase().includes(suiteName.toLowerCase())
  );
  
  if (!suite) {
    console.log(`❌ Test suite "${suiteName}" not found!`);
    console.log('\nAvailable suites:');
    testSuites.forEach(s => {
      console.log(`  - ${s.name}`);
    });
    process.exit(1);
  }
  
  const success = await runTestSuite(suite);
  process.exit(success ? 0 : 1);
}

// Display help information
function showHelp() {
  console.log('Usage: node runTests.js [options]\n');
  console.log('Options:');
  console.log('  --coverage          Generate coverage report');
  console.log('  --watch             Watch for file changes');
  console.log('  --verbose           Verbose output');
  console.log('  --suite=<name>      Run specific test suite');
  console.log('  --help              Show this help message\n');
  console.log('Available test suites:');
  testSuites.forEach(suite => {
    console.log(`  - ${suite.name}`);
    console.log(`    ${suite.description}`);
  });
  console.log('\nExamples:');
  console.log('  node runTests.js                    # Run all tests');
  console.log('  node runTests.js --coverage         # Run with coverage');
  console.log('  node runTests.js --suite=controllers # Run only controller tests');
  console.log('  node runTests.js --watch            # Run in watch mode');
}

// Main execution
async function main() {
  if (process.argv.includes('--help')) {
    showHelp();
    return;
  }
  
  try {
    if (testConfig.suite) {
      await runSpecificSuite(testConfig.suite);
    } else {
      await runAllTests();
    }
  } catch (error) {
    console.error('💥 Test runner error:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Test runner interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Test runner terminated');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});