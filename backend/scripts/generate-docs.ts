#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { generateDocsFromRoutes } from '../src/middleware/swagger';

/**
 * Script to generate API documentation from routes
 * Usage: npm run docs:generate
 */

interface DocGenerationOptions {
  outputFormat: 'yaml' | 'json';
  outputPath: string;
  includeExamples: boolean;
  includeSchemas: boolean;
}

const defaultOptions: DocGenerationOptions = {
  outputFormat: 'yaml',
  outputPath: './docs/generated-api.yaml',
  includeExamples: true,
  includeSchemas: true
};

const generateApiDocumentation = async (options: DocGenerationOptions = defaultOptions): Promise<void> => {
  console.log('🔄 Generating API documentation...\n');

  try {
    // Mock Express app for route extraction (in real scenario, this would be the actual app)
    const mockApp = {
      _router: {
        stack: []
      }
    };

    // Generate documentation from routes
    const docs = generateDocsFromRoutes(mockApp as any);

    // Enhance the generated documentation
    const enhancedDocs = await enhanceDocumentation(docs, options);

    // Write to file
    const outputDir = path.dirname(options.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let content: string;
    if (options.outputFormat === 'yaml') {
      content = yaml.dump(enhancedDocs, { 
        indent: 2,
        lineWidth: 120,
        quotingType: '"',
        forceQuotes: false
      });
    } else {
      content = JSON.stringify(enhancedDocs, null, 2);
    }

    fs.writeFileSync(options.outputPath, content);
    console.log(`✅ Documentation generated successfully at: ${options.outputPath}`);

    // Generate additional formats
    if (options.outputFormat === 'yaml') {
      const jsonPath = options.outputPath.replace(/\.ya?ml$/, '.json');
      fs.writeFileSync(jsonPath, JSON.stringify(enhancedDocs, null, 2));
      console.log(`✅ JSON version generated at: ${jsonPath}`);
    }

    // Generate HTML documentation
    await generateHtmlDocs(enhancedDocs, outputDir);

  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    process.exit(1);
  }
};

const enhanceDocumentation = async (docs: any, options: DocGenerationOptions): Promise<any> => {
  console.log('🎨 Enhancing documentation...');

  // Add server information
  docs.servers = [
    {
      url: 'https://api.kitchenpantry.com/v1',
      description: 'Production server'
    },
    {
      url: 'https://staging-api.kitchenpantry.com/v1',
      description: 'Staging server'
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server'
    }
  ];

  // Add security schemes
  docs.components = docs.components || {};
  docs.components.securitySchemes = {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token issued by Supabase Auth'
    }
  };

  // Add global security requirement
  docs.security = [{ BearerAuth: [] }];

  // Add tags
  docs.tags = [
    {
      name: 'Organizations',
      description: 'Organization management endpoints'
    },
    {
      name: 'Contacts',
      description: 'Contact management endpoints'
    },
    {
      name: 'Interactions',
      description: 'Interaction tracking endpoints'
    },
    {
      name: 'Opportunities',
      description: 'Opportunity management endpoints'
    },
    {
      name: 'Search',
      description: 'Search and discovery endpoints'
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints'
    },
    {
      name: 'Files',
      description: 'File upload and management endpoints'
    }
  ];

  // Add common schemas if requested
  if (options.includeSchemas) {
    docs.components.schemas = await generateCommonSchemas();
  }

  // Add examples if requested
  if (options.includeExamples) {
    docs = await addExamples(docs);
  }

  return docs;
};

const generateCommonSchemas = async (): Promise<any> => {
  return {
    ErrorResponse: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              field: { type: 'string' },
              details: { type: 'string' }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            request_id: { type: 'string' }
          }
        }
      }
    },
    SuccessResponse: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        },
        data: {
          type: 'object'
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            request_id: { type: 'string' }
          }
        }
      }
    },
    PaginationMeta: {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 50 },
        total: { type: 'integer', example: 150 },
        pages: { type: 'integer', example: 3 },
        has_next: { type: 'boolean', example: true },
        has_prev: { type: 'boolean', example: false }
      }
    }
  };
};

const addExamples = async (docs: any): Promise<any> => {
  console.log('📝 Adding examples to documentation...');

  // Add examples to existing paths
  if (docs.paths) {
    Object.entries(docs.paths).forEach(([path, pathItem]: [string, any]) => {
      if (pathItem && typeof pathItem === 'object') {
        const methods = ['get', 'post', 'put', 'patch', 'delete'];
        methods.forEach(method => {
          if (pathItem[method]) {
            // Add example responses
            if (pathItem[method].responses) {
              Object.entries(pathItem[method].responses).forEach(([statusCode, response]: [string, any]) => {
                if (response && typeof response === 'object') {
                  response.content = response.content || {
                    'application/json': {
                      schema: {
                        $ref: statusCode.startsWith('2') ? '#/components/schemas/SuccessResponse' : '#/components/schemas/ErrorResponse'
                      }
                    }
                  };
                }
              });
            }
          }
        });
      }
    });
  }

  return docs;
};

const generateHtmlDocs = async (docs: any, outputDir: string): Promise<void> => {
  console.log('📄 Generating HTML documentation...');

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitchen Pantry CRM API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            display: none;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@3.52.5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: './api-docs.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>
`;

  const htmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(htmlPath, htmlTemplate);
  
  const jsonPath = path.join(outputDir, 'api-docs.json');
  fs.writeFileSync(jsonPath, JSON.stringify(docs, null, 2));
  
  console.log(`✅ HTML documentation generated at: ${htmlPath}`);
};

const main = async () => {
  const args = process.argv.slice(2);
  const options = { ...defaultOptions };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--format':
        options.outputFormat = args[++i] as 'yaml' | 'json';
        break;
      case '--output':
        options.outputPath = args[++i];
        break;
      case '--no-examples':
        options.includeExamples = false;
        break;
      case '--no-schemas':
        options.includeSchemas = false;
        break;
      case '--help':
        console.log(`
Usage: npm run docs:generate [options]

Options:
  --format <yaml|json>  Output format (default: yaml)
  --output <path>       Output file path (default: ./docs/generated-api.yaml)
  --no-examples         Don't include examples
  --no-schemas          Don't include common schemas
  --help                Show this help message
`);
        process.exit(0);
        break;
    }
  }

  await generateApiDocumentation(options);
};

if (require.main === module) {
  main().catch(console.error);
}

export { generateApiDocumentation };