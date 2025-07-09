#!/usr/bin/env ts-node

import { validateOpenApiSpec } from '../src/middleware/swagger';
import { specs as openApiSpecs } from '../src/middleware/swagger';

/**
 * Script to validate OpenAPI documentation
 * Usage: npm run docs:validate
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const validateDocumentation = (): ValidationResult => {
  console.log('🔍 Validating OpenAPI documentation...\n');

  const result = validateOpenApiSpec();
  const warnings: string[] = [];

  // Additional validation checks
  if (openApiSpecs.paths) {
    const pathCount = Object.keys(openApiSpecs.paths).length;
    console.log(`📊 Found ${pathCount} API endpoints`);

    if (pathCount === 0) {
      result.errors.push('No API endpoints found in documentation');
    }

    // Check for missing descriptions
    Object.entries(openApiSpecs.paths).forEach(([path, pathItem]: [string, any]) => {
      if (pathItem && typeof pathItem === 'object') {
        const methods = ['get', 'post', 'put', 'patch', 'delete'];
        methods.forEach(method => {
          if (pathItem[method]) {
            if (!pathItem[method].summary) {
              warnings.push(`Missing summary for ${method.toUpperCase()} ${path}`);
            }
            if (!pathItem[method].description) {
              warnings.push(`Missing description for ${method.toUpperCase()} ${path}`);
            }
            if (!pathItem[method].tags || pathItem[method].tags.length === 0) {
              warnings.push(`Missing tags for ${method.toUpperCase()} ${path}`);
            }
          }
        });
      }
    });
  }

  // Check for security definitions
  if (!openApiSpecs.components || !openApiSpecs.components.securitySchemes) {
    warnings.push('No security schemes defined');
  }

  // Check for response schemas
  if (openApiSpecs.paths) {
    Object.entries(openApiSpecs.paths).forEach(([path, pathItem]: [string, any]) => {
      if (pathItem && typeof pathItem === 'object') {
        const methods = ['get', 'post', 'put', 'patch', 'delete'];
        methods.forEach(method => {
          if (pathItem[method] && pathItem[method].responses) {
            const responses = pathItem[method].responses;
            if (!responses['200'] && !responses['201'] && !responses['204']) {
              warnings.push(`No success response defined for ${method.toUpperCase()} ${path}`);
            }
            if (!responses['400'] && !responses['401'] && !responses['403'] && !responses['404']) {
              warnings.push(`No error responses defined for ${method.toUpperCase()} ${path}`);
            }
          }
        });
      }
    });
  }

  return {
    valid: result.valid,
    errors: result.errors,
    warnings
  };
};

const main = () => {
  const validation = validateDocumentation();

  if (validation.valid) {
    console.log('\n✅ OpenAPI documentation is valid!');
  } else {
    console.log('\n❌ OpenAPI documentation has errors:');
    validation.errors.forEach(error => {
      console.log(`   • ${error}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`   • ${warning}`);
    });
  }

  console.log('\n📈 Documentation Statistics:');
  console.log(`   • Endpoints: ${Object.keys(openApiSpecs.paths || {}).length}`);
  console.log(`   • Schemas: ${Object.keys(openApiSpecs.components?.schemas || {}).length}`);
  console.log(`   • Security Schemes: ${Object.keys(openApiSpecs.components?.securitySchemes || {}).length}`);
  console.log(`   • Tags: ${(openApiSpecs.tags || []).length}`);

  // Exit with error code if validation failed
  if (!validation.valid) {
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

export { validateDocumentation };