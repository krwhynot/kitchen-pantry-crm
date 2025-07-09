import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Load OpenAPI specification from YAML file
const openApiSpecPath = path.join(__dirname, '../docs/openapi.yaml');
let openApiSpec: any;

try {
  const yamlContent = fs.readFileSync(openApiSpecPath, 'utf8');
  openApiSpec = yaml.load(yamlContent);
} catch (error) {
  console.error('Failed to load OpenAPI specification:', error);
  // Fallback to basic spec if file not found
  openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Kitchen Pantry CRM API',
      version: '1.0.0',
      description: 'A comprehensive RESTful API for managing food service industry relationships'
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.kitchenpantry.com/v1'
          : 'http://localhost:3000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ]
  };
}

// Swagger JSDoc options for generating documentation from code comments
const swaggerOptions = {
  definition: openApiSpec,
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../controllers/*.ts'),
    path.join(__dirname, '../models/*.ts')
  ],
};

// Generate the OpenAPI specification
const specs = swaggerJsdoc(swaggerOptions);

// Custom CSS for Swagger UI styling
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info { margin: 50px 0; }
  .swagger-ui .info hgroup.main { margin: 0 0 20px 0; }
  .swagger-ui .info h2 { color: #3b4151; }
  .swagger-ui .scheme-container { 
    background: #f7f7f7;
    padding: 15px;
    border-radius: 4px;
    margin: 20px 0;
  }
  .swagger-ui .btn.authorize { 
    background-color: #49cc90;
    border-color: #49cc90;
  }
  .swagger-ui .btn.authorize:hover { 
    background-color: #3cb371;
    border-color: #3cb371;
  }
`;

// Swagger UI options
const swaggerUiOptions = {
  customCss,
  customSiteTitle: 'Kitchen Pantry CRM API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Add custom headers or modify requests
      req.headers['X-API-Client'] = 'Swagger-UI';
      return req;
    },
    responseInterceptor: (res: any) => {
      // Log responses or modify them
      if (process.env.NODE_ENV === 'development') {
        console.log('API Response:', res.status, res.url);
      }
      return res;
    }
  }
};

// Function to setup Swagger documentation
export const setupSwaggerDocs = (app: Application): void => {
  // Serve the OpenAPI JSON specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Serve the OpenAPI YAML specification
  app.get('/api-docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'application/x-yaml');
    res.send(yaml.dump(specs));
  });

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, swaggerUiOptions));

  // Redirect root /docs to /api-docs
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  // Health check for documentation
  app.get('/api-docs/health', (req, res) => {
    res.json({
      status: 'healthy',
      documentation: 'available',
      endpoints: Object.keys(specs.paths || {}).length,
      lastUpdated: new Date().toISOString()
    });
  });

  console.log('📚 API Documentation available at:');
  console.log(`   Swagger UI: http://localhost:${process.env.PORT || 3000}/api-docs`);
  console.log(`   OpenAPI JSON: http://localhost:${process.env.PORT || 3000}/api-docs.json`);
  console.log(`   OpenAPI YAML: http://localhost:${process.env.PORT || 3000}/api-docs.yaml`);
};

// Function to validate OpenAPI specification
export const validateOpenApiSpec = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  try {
    // Basic validation
    if (!openApiSpec.openapi) {
      errors.push('Missing openapi version');
    }

    if (!openApiSpec.info || !openApiSpec.info.title || !openApiSpec.info.version) {
      errors.push('Missing required info fields (title, version)');
    }

    if (!openApiSpec.paths || Object.keys(openApiSpec.paths).length === 0) {
      errors.push('No API paths defined');
    }

    // Validate paths structure
    if (openApiSpec.paths) {
      Object.entries(openApiSpec.paths).forEach(([path, pathItem]: [string, any]) => {
        if (!path.startsWith('/')) {
          errors.push(`Invalid path format: ${path}`);
        }

        if (pathItem && typeof pathItem === 'object') {
          const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
          const hasValidMethod = httpMethods.some(method => method in pathItem);
          
          if (!hasValidMethod) {
            errors.push(`No valid HTTP methods found for path: ${path}`);
          }
        }
      });
    }

    // Validate components if present
    if (openApiSpec.components && openApiSpec.components.schemas) {
      Object.entries(openApiSpec.components.schemas).forEach(([schemaName, schema]: [string, any]) => {
        if (!schema || typeof schema !== 'object') {
          errors.push(`Invalid schema definition: ${schemaName}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

// Function to generate documentation from routes
export const generateDocsFromRoutes = (app: Application): any => {
  const routes: any = {};
  
  // Extract routes from Express app
  app._router?.stack?.forEach((middleware: any) => {
    if (middleware.route) {
      // Direct route
      const path = middleware.route.path;
      const methods = Object.keys(middleware.route.methods);
      
      if (!routes[path]) {
        routes[path] = {};
      }
      
      methods.forEach(method => {
        routes[path][method] = {
          summary: `${method.toUpperCase()} ${path}`,
          description: `Auto-generated documentation for ${method.toUpperCase()} ${path}`,
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        };
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle?.stack?.forEach((handler: any) => {
        if (handler.route) {
          const basePath = middleware.regexp?.source?.replace(/\$|\^|\\|\//g, '') || '';
          const fullPath = `/${basePath}${handler.route.path}`.replace(/\/+/g, '/');
          const methods = Object.keys(handler.route.methods);
          
          if (!routes[fullPath]) {
            routes[fullPath] = {};
          }
          
          methods.forEach(method => {
            routes[fullPath][method] = {
              summary: `${method.toUpperCase()} ${fullPath}`,
              description: `Auto-generated documentation for ${method.toUpperCase()} ${fullPath}`,
              responses: {
                '200': {
                  description: 'Success'
                }
              }
            };
          });
        }
      });
    }
  });

  return {
    openapi: '3.0.3',
    info: {
      title: 'Kitchen Pantry CRM API',
      version: '1.0.0',
      description: 'Auto-generated API documentation'
    },
    paths: routes
  };
};

// Export the specs for use in other parts of the application
export { specs as openApiSpecs };
export default setupSwaggerDocs;