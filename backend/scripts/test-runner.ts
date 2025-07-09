#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive test runner for API documentation and testing
 * Usage: npm run test:api-docs
 */

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  errors: string[];
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  overallCoverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

const runCommand = (command: string, args: string[], cwd: string = process.cwd()): Promise<{ stdout: string; stderr: string; code: number }> => {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
};

const runApiTests = async (): Promise<TestSuite> => {
  console.log('🧪 Running API test suite...\n');

  const testFiles = [
    'organizations.test.ts',
    'contacts.test.ts',
    'interactions.test.ts',
    'opportunities.test.ts',
    'search.test.ts',
    'analytics.test.ts',
    'files.test.ts',
    'auth.test.ts'
  ];

  const testResults: TestResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;

  for (const testFile of testFiles) {
    const startTime = Date.now();
    console.log(`   Running ${testFile}...`);

    try {
      const result = await runCommand('npm', ['run', 'test', '--', `--testPathPattern=${testFile}`]);
      const duration = Date.now() - startTime;
      
      const passed = result.code === 0;
      const errors = result.stderr ? [result.stderr] : [];

      if (passed) {
        totalPassed++;
        console.log(`   ✅ ${testFile} - PASSED (${duration}ms)`);
      } else {
        totalFailed++;
        console.log(`   ❌ ${testFile} - FAILED (${duration}ms)`);
        if (errors.length > 0) {
          console.log(`      Error: ${errors[0].slice(0, 200)}...`);
        }
      }

      testResults.push({
        name: testFile,
        passed,
        duration,
        errors
      });

      totalDuration += duration;
    } catch (error) {
      console.log(`   ❌ ${testFile} - ERROR`);
      testResults.push({
        name: testFile,
        passed: false,
        duration: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      });
      totalFailed++;
    }
  }

  return {
    name: 'API Test Suite',
    tests: testResults,
    totalPassed,
    totalFailed,
    totalDuration
  };
};

const validateDocumentation = async (): Promise<TestResult> => {
  console.log('📚 Validating API documentation...\n');

  const startTime = Date.now();
  
  try {
    // Check if OpenAPI spec exists
    const openApiPath = path.join(__dirname, '../docs/openapi.yaml');
    if (!fs.existsSync(openApiPath)) {
      return {
        name: 'Documentation Validation',
        passed: false,
        duration: Date.now() - startTime,
        errors: ['OpenAPI specification file not found']
      };
    }

    // Validate OpenAPI spec
    const result = await runCommand('ts-node', [path.join(__dirname, 'validate-docs.ts')]);
    
    return {
      name: 'Documentation Validation',
      passed: result.code === 0,
      duration: Date.now() - startTime,
      errors: result.code !== 0 ? [result.stderr] : []
    };
  } catch (error) {
    return {
      name: 'Documentation Validation',
      passed: false,
      duration: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
};

const generateCoverageReport = async (): Promise<TestResult> => {
  console.log('📊 Generating test coverage report...\n');

  const startTime = Date.now();
  
  try {
    const result = await runCommand('npm', ['run', 'test:coverage']);
    
    return {
      name: 'Coverage Report',
      passed: result.code === 0,
      duration: Date.now() - startTime,
      errors: result.code !== 0 ? [result.stderr] : []
    };
  } catch (error) {
    return {
      name: 'Coverage Report',
      passed: false,
      duration: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
};

const generateTestReport = (testSuite: TestSuite, docValidation: TestResult, coverage: TestResult): void => {
  const reportPath = path.join(__dirname, '../test-results.json');
  const htmlReportPath = path.join(__dirname, '../test-results.html');

  // JSON Report
  const jsonReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testSuite.tests.length + 2, // +2 for doc validation and coverage
      passed: testSuite.totalPassed + (docValidation.passed ? 1 : 0) + (coverage.passed ? 1 : 0),
      failed: testSuite.totalFailed + (docValidation.passed ? 0 : 1) + (coverage.passed ? 0 : 1),
      duration: testSuite.totalDuration + docValidation.duration + coverage.duration
    },
    testSuite,
    docValidation,
    coverage
  };

  fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2));

  // HTML Report
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitchen Pantry CRM API Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .passed { border-left-color: #28a745; background: #d4edda; }
        .failed { border-left-color: #dc3545; background: #f8d7da; }
        .error { color: #dc3545; font-family: monospace; margin-top: 5px; }
        .duration { color: #6c757d; font-size: 0.9em; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Kitchen Pantry CRM API Test Results</h1>
    
    <div class="summary">
        <h2>Test Summary</h2>
        <p><strong>Total Tests:</strong> ${jsonReport.summary.totalTests}</p>
        <p><strong>Passed:</strong> ${jsonReport.summary.passed}</p>
        <p><strong>Failed:</strong> ${jsonReport.summary.failed}</p>
        <p><strong>Duration:</strong> ${jsonReport.summary.duration}ms</p>
        <p><strong>Success Rate:</strong> ${((jsonReport.summary.passed / jsonReport.summary.totalTests) * 100).toFixed(1)}%</p>
    </div>

    <h2>API Test Suite</h2>
    <table>
        <thead>
            <tr>
                <th>Test File</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Errors</th>
            </tr>
        </thead>
        <tbody>
            ${testSuite.tests.map(test => `
                <tr>
                    <td>${test.name}</td>
                    <td class="${test.passed ? 'passed' : 'failed'}">${test.passed ? '✅ PASSED' : '❌ FAILED'}</td>
                    <td>${test.duration}ms</td>
                    <td>${test.errors.join(', ')}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Documentation Validation</h2>
    <div class="test-result ${docValidation.passed ? 'passed' : 'failed'}">
        <strong>Status:</strong> ${docValidation.passed ? '✅ PASSED' : '❌ FAILED'}<br>
        <span class="duration">Duration: ${docValidation.duration}ms</span>
        ${docValidation.errors.length > 0 ? `<div class="error">${docValidation.errors.join('<br>')}</div>` : ''}
    </div>

    <h2>Coverage Report</h2>
    <div class="test-result ${coverage.passed ? 'passed' : 'failed'}">
        <strong>Status:</strong> ${coverage.passed ? '✅ PASSED' : '❌ FAILED'}<br>
        <span class="duration">Duration: ${coverage.duration}ms</span>
        ${coverage.errors.length > 0 ? `<div class="error">${coverage.errors.join('<br>')}</div>` : ''}
    </div>

    <p><em>Generated on ${new Date().toLocaleString()}</em></p>
</body>
</html>
`;

  fs.writeFileSync(htmlReportPath, htmlReport);

  console.log(`\n📄 Test report generated: ${reportPath}`);
  console.log(`📄 HTML report generated: ${htmlReportPath}`);
};

const main = async () => {
  console.log('🚀 Starting comprehensive API documentation and testing validation...\n');

  const startTime = Date.now();

  try {
    // Run all tests
    const [testSuite, docValidation, coverage] = await Promise.all([
      runApiTests(),
      validateDocumentation(),
      generateCoverageReport()
    ]);

    const totalDuration = Date.now() - startTime;

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testSuite.tests.length + 2}`);
    console.log(`Passed: ${testSuite.totalPassed + (docValidation.passed ? 1 : 0) + (coverage.passed ? 1 : 0)}`);
    console.log(`Failed: ${testSuite.totalFailed + (docValidation.passed ? 0 : 1) + (coverage.passed ? 0 : 1)}`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${(((testSuite.totalPassed + (docValidation.passed ? 1 : 0) + (coverage.passed ? 1 : 0)) / (testSuite.tests.length + 2)) * 100).toFixed(1)}%`);

    // Generate reports
    generateTestReport(testSuite, docValidation, coverage);

    const allPassed = testSuite.totalFailed === 0 && docValidation.passed && coverage.passed;
    
    if (allPassed) {
      console.log('\n🎉 All tests passed! API documentation and testing is complete.');
    } else {
      console.log('\n❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error running test suite:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main().catch(console.error);
}

export { runApiTests, validateDocumentation, generateCoverageReport };