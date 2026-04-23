const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory Management API',
      version: '1.0.0',
      description: 'API documentation for multi-tenant inventory management system',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Accounts', description: 'Account management endpoints' },
      { name: 'Authentication', description: 'OTP-based authentication endpoints' },
      { name: 'Products', description: 'Product management endpoints' },
      { name: 'Brands', description: 'Brand management endpoints' },
      { name: 'Categories', description: 'Category management endpoints' },
      { name: 'Warehouses', description: 'Warehouse management endpoints' },
      { name: 'Invoices', description: 'Invoice management endpoints' },
      { name: 'Purchase Orders', description: 'Purchase order management endpoints' },
      { name: 'Stock Adjustments', description: 'Stock adjustment and position tracking endpoints' },
      { name: 'Settings', description: 'Application settings and configuration endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Account: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            companyName: { type: 'string', example: 'ABC Enterprises' },
            legalName: { type: 'string', example: 'ABC Enterprises Private Limited' },
            gstNumber: { type: 'string', example: '29ABCDE1234F1Z5' },
            panNumber: { type: 'string', example: 'ABCDE1234F' },
            email: { type: 'string', example: 'contact@abc.com' },
            phone: { type: 'string', example: '+919876543210' },
            addressLine1: { type: 'string', example: '123 Main Street' },
            addressLine2: { type: 'string', example: 'Suite 456' },
            city: { type: 'string', example: 'Mumbai' },
            state: { type: 'string', example: 'Maharashtra' },
            postalCode: { type: 'string', example: '400001' },
            country: { type: 'string', example: 'India' },
            logo: { type: 'string', example: 'base64encodedimage...' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AccountRegisterRequest: {
          type: 'object',
          required: ['companyName', 'phone'],
          properties: {
            companyName: { type: 'string', example: 'ABC Enterprises' },
            legalName: { type: 'string', example: 'ABC Enterprises Private Limited' },
            gstNumber: { type: 'string', example: '29ABCDE1234F1Z5' },
            panNumber: { type: 'string', example: 'ABCDE1234F' },
            email: { type: 'string', example: 'contact@abc.com' },
            phone: { type: 'string', example: '+919876543210' },
            addressLine1: { type: 'string', example: '123 Main Street' },
            addressLine2: { type: 'string', example: 'Suite 456' },
            city: { type: 'string', example: 'Mumbai' },
            state: { type: 'string', example: 'Maharashtra' },
            postalCode: { type: 'string', example: '400001' },
            country: { type: 'string', example: 'India' },
          },
        },
        AccountRegisterResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Account created successfully' },
            data: {
              type: 'object',
              properties: {
                account: { $ref: '#/components/schemas/Account' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 1 },
                    phone: { type: 'string', example: '+919876543210' },
                    name: { type: 'string', example: 'Admin User' },
                    isActive: { type: 'boolean', example: true },
                    roleId: { type: 'integer', example: 1 },
                    accountId: { type: 'integer', example: 1 },
                  },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, 'server.js'),
    path.join(__dirname, 'routes', 'account.routes.js'),
    path.join(__dirname, 'routes', 'product.routes.js'),
    path.join(__dirname, 'routes', 'brand.routes.js'),
    path.join(__dirname, 'routes', 'category.routes.js'),
    path.join(__dirname, 'routes', 'warehouse.routes.js'),
    path.join(__dirname, 'routes', 'invoice.routes.js'),
    path.join(__dirname, 'routes', 'purchaseorder.routes.js'),
    path.join(__dirname, 'routes', 'stockadjustment.routes.js'),
    path.join(__dirname, 'routes', 'settings.routes.js')
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
