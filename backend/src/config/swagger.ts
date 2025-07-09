import swaggerJSDoc from 'swagger-jsdoc'
import { env } from './env'

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kitchen Pantry CRM API',
      version: '1.0.0',
      description: 'Modern CRM system for food service industry professionals',
      contact: {
        name: 'Kitchen Pantry CRM Team',
        email: 'support@kitchenpantrycrm.com'
      },
      license: {
        name: 'UNLICENSED',
        url: 'https://github.com/krwhynot/kitchen-pantry-crm'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Organization: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier'
            },
            name: {
              type: 'string',
              description: 'Organization name'
            },
            type: {
              type: 'string',
              enum: ['restaurant', 'food_service', 'distributor', 'manufacturer'],
              description: 'Type of organization'
            },
            address: {
              type: 'string',
              description: 'Physical address'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            website: {
              type: 'string',
              format: 'uri',
              description: 'Website URL'
            },
            parentId: {
              type: 'string',
              format: 'uuid',
              description: 'Parent organization ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Contact: {
          type: 'object',
          required: ['firstName', 'lastName', 'organizationId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier'
            },
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            title: {
              type: 'string',
              description: 'Job title'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            phone: {
              type: 'string',
              description: 'Phone number'
            },
            mobile: {
              type: 'string',
              description: 'Mobile number'
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
              description: 'Organization ID'
            },
            isDecisionMaker: {
              type: 'boolean',
              default: false,
              description: 'Whether contact is a decision maker'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Interaction: {
          type: 'object',
          required: ['type', 'subject', 'contactId', 'organizationId', 'userId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier'
            },
            type: {
              type: 'string',
              enum: ['email', 'call', 'meeting', 'note'],
              description: 'Type of interaction'
            },
            subject: {
              type: 'string',
              description: 'Interaction subject'
            },
            content: {
              type: 'string',
              description: 'Interaction content'
            },
            contactId: {
              type: 'string',
              format: 'uuid',
              description: 'Contact ID'
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
              description: 'Organization ID'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            scheduledAt: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled timestamp'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Completed timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Opportunity: {
          type: 'object',
          required: ['title', 'value', 'stage', 'probability', 'organizationId', 'contactId', 'userId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier'
            },
            title: {
              type: 'string',
              description: 'Opportunity title'
            },
            description: {
              type: 'string',
              description: 'Opportunity description'
            },
            value: {
              type: 'number',
              minimum: 0,
              description: 'Opportunity value'
            },
            stage: {
              type: 'string',
              enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
              description: 'Sales stage'
            },
            probability: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Success probability percentage'
            },
            expectedCloseDate: {
              type: 'string',
              format: 'date-time',
              description: 'Expected close date'
            },
            actualCloseDate: {
              type: 'string',
              format: 'date-time',
              description: 'Actual close date'
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
              description: 'Organization ID'
            },
            contactId: {
              type: 'string',
              format: 'uuid',
              description: 'Contact ID'
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Product: {
          type: 'object',
          required: ['name', 'sku', 'category', 'unitPrice', 'unit'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            sku: {
              type: 'string',
              description: 'Stock keeping unit'
            },
            category: {
              type: 'string',
              description: 'Product category'
            },
            unitPrice: {
              type: 'number',
              minimum: 0,
              description: 'Unit price'
            },
            unit: {
              type: 'string',
              description: 'Unit of measurement'
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether product is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        User: {
          type: 'object',
          required: ['email', 'firstName', 'lastName', 'role', 'organizationId'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'sales_rep'],
              description: 'User role'
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
              description: 'Organization ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error']
            },
            data: {
              type: 'object'
            },
            message: {
              type: 'string'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['error']
            },
            statusCode: {
              type: 'number'
            },
            message: {
              type: 'string'
            },
            stack: {
              type: 'string',
              description: 'Error stack trace (development only)'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/index.ts']
}

export const swaggerSpec = swaggerJSDoc(options)