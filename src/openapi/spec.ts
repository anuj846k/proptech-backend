const baseServerUrl =
  process.env.API_URL ||
  process.env.FRONTEND_URL?.replace('3000', '8000') ||
  'http://localhost:8000';

function buildSpec(): Record<string, unknown> {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Property Maintenance API',
      version: '1.0.0',
      description:
        'API for property managers, tenants, and technicians. Covers auth, properties, units, maintenance tickets, notifications, and activity.',
    },
    servers: [{ url: baseServerUrl }],
    tags: [
      { name: 'Auth', description: 'Register, login, refresh, logout' },
      {
        name: 'Users',
        description: 'Current user, list users, get/update by ID',
      },
      { name: 'Tickets', description: 'Create, list, assign, update progress' },
      {
        name: 'Properties',
        description: 'Create, list, occupancy, units, assign manager/tenant',
      },
      { name: 'Units', description: 'My units (tenant)' },
      { name: 'Notifications', description: 'List and mark as read' },
      { name: 'Activity', description: 'Ticket activity log' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token from login or refresh',
        },
      },
      schemas: {
        Error: {
          description: 'Standard error response body for 4xx/5xx responses',
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        RegisterBody: {
          type: 'object',
          required: ['name', 'email', 'password', 'role'],
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            phone: { type: 'string', pattern: '^\\d{10}$', nullable: true },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'TENANT'],
            },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'TENANT'],
            },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        UpdateUserBody: {
          type: 'object',
          minProperties: 1,
          properties: {
            name: { type: 'string', minLength: 1 },
            phone: { type: 'string', pattern: '^\\d{10}$' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'TECHNICIAN', 'TENANT'],
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
        TicketCreateBody: {
          type: 'object',
          required: ['title', 'description', 'propertyId', 'unit'],
          properties: {
            title: { type: 'string', minLength: 3 },
            description: { type: 'string', minLength: 5 },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            },
            propertyId: { type: 'string', format: 'uuid' },
            unit: { type: 'string', minLength: 1 },
            imageUrls: {
              type: 'array',
              items: { type: 'string', format: 'uri' },
            },
          },
        },
        TicketAssignBody: {
          type: 'object',
          required: ['technicianId'],
          properties: { technicianId: { type: 'string', format: 'uuid' } },
        },
        TicketUpdateBody: {
          type: 'object',
          minProperties: 1,
          properties: {
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            status: {
              type: 'string',
              enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DONE'],
            },
          },
        },
        TicketProgressBody: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['IN_PROGRESS', 'DONE'] },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string' },
            status: { type: 'string' },
            propertyId: { type: 'string', format: 'uuid' },
            unit: { type: 'string' },
            createdBy: { type: 'string', format: 'uuid' },
            assignedTo: { type: 'string', format: 'uuid', nullable: true },
            imageUrls: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PropertyCreateBody: {
          type: 'object',
          required: ['name', 'address'],
          properties: {
            name: { type: 'string', minLength: 3 },
            address: { type: 'string', minLength: 5 },
          },
        },
        AssignManagerBody: {
          type: 'object',
          required: ['managerId'],
          properties: { managerId: { type: 'string', format: 'uuid' } },
        },
        CreateUnitBody: {
          type: 'object',
          required: ['unitNumber', 'floor'],
          properties: {
            unitNumber: { type: 'string', minLength: 1 },
            floor: { type: 'integer', minimum: 0 },
            tenantId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        AssignTenantBody: {
          type: 'object',
          properties: {
            tenantId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            address: { type: 'string' },
            managerId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Unit: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            unitNumber: { type: 'string' },
            floor: { type: 'integer' },
            propertyId: { type: 'string', format: 'uuid' },
            tenantId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            message: { type: 'string' },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ActivityItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticketId: { type: 'string', format: 'uuid' },
            action: { type: 'string' },
            performedBy: { type: 'string', format: 'uuid' },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/api/v1/users/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description:
            'Create an account. Roles: ADMIN, MANAGER, TECHNICIAN, TENANT.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterBody' },
              },
            },
          },
          responses: {
            '201': {
              description: 'User created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Log in',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginBody' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          description: 'Uses refresh token from cookie or body.',
          responses: {
            '200': {
              description: 'New tokens',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
            '401': {
              description: 'Invalid or expired refresh token',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Log out',
          responses: {
            '200': { description: 'Logged out' },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/auth/me': {
        get: {
          tags: ['Users'],
          summary: 'Get current user',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Current user',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/users': {
        get: {
          tags: ['Users'],
          summary: 'List users',
          description: 'ADMIN and MANAGER only.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID',
          description: 'ADMIN only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'User',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user',
          description: 'ADMIN only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateUserBody' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated user',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/tickets': {
        post: {
          tags: ['Tickets'],
          summary: 'Create ticket',
          description: 'TENANT only. Can include multipart images.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TicketCreateBody' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Ticket created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Ticket' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        get: {
          tags: ['Tickets'],
          summary: 'List all tickets',
          description:
            'ADMIN and MANAGER only. Query: status, priority, propertyId.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'DONE'],
              },
            },
            {
              name: 'priority',
              in: 'query',
              schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            },
            {
              name: 'propertyId',
              in: 'query',
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'List of tickets',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tickets: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Ticket' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/tickets/my': {
        get: {
          tags: ['Tickets'],
          summary: 'My tickets',
          description: 'TENANT only. Tickets created by the current user.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of tickets',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tickets: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Ticket' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/tickets/assigned': {
        get: {
          tags: ['Tickets'],
          summary: 'Assigned tickets',
          description: 'TECHNICIAN only. Tickets assigned to the current user.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of tickets',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tickets: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Ticket' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/tickets/{id}': {
        get: {
          tags: ['Tickets'],
          summary: 'Get ticket by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Ticket',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Ticket' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        patch: {
          tags: ['Tickets'],
          summary: 'Update ticket (priority/status)',
          description: 'ADMIN and MANAGER only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TicketUpdateBody' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Updated ticket',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Ticket' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/tickets/{id}/assign': {
        patch: {
          tags: ['Tickets'],
          summary: 'Assign technician to ticket',
          description: 'ADMIN and MANAGER only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TicketAssignBody' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ticket assigned',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Ticket' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/tickets/{id}/progress': {
        patch: {
          tags: ['Tickets'],
          summary: 'Update ticket progress',
          description: 'TECHNICIAN only. Set status to IN_PROGRESS or DONE.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TicketProgressBody' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ticket updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Ticket' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/properties': {
        post: {
          tags: ['Properties'],
          summary: 'Create property',
          description: 'ADMIN only.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PropertyCreateBody' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Property created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Property' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        get: {
          tags: ['Properties'],
          summary: 'List properties',
          description: 'ADMIN and MANAGER only.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of properties',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      properties: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Property' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/properties/occupancy': {
        get: {
          tags: ['Properties'],
          summary: 'Get occupancy',
          description: 'ADMIN and MANAGER only.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Occupancy data' },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/properties/{id}': {
        get: {
          tags: ['Properties'],
          summary: 'Get property by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'Property',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Property' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/properties/{id}/assign-manager': {
        post: {
          tags: ['Properties'],
          summary: 'Assign manager to property',
          description: 'ADMIN only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AssignManagerBody' },
              },
            },
          },
          responses: {
            '200': { description: 'Manager assigned' },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/properties/{id}/units': {
        post: {
          tags: ['Properties'],
          summary: 'Create unit',
          description: 'ADMIN and MANAGER only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateUnitBody' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Unit created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Unit' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/properties/{id}/units/{unitId}': {
        patch: {
          tags: ['Properties'],
          summary: 'Assign tenant to unit',
          description: 'ADMIN and MANAGER only.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'unitId',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AssignTenantBody' },
              },
            },
          },
          responses: {
            '200': { description: 'Tenant assigned' },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/units': {
        get: {
          tags: ['Units'],
          summary: 'List all units',
          description: 'ADMIN and MANAGER only.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of units',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      units: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Unit' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/units/my': {
        get: {
          tags: ['Units'],
          summary: 'My units',
          description: 'TENANT only. Units assigned to the current user.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of units',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      units: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Unit' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get my notifications',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of notifications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      notifications: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Notification' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': { description: 'Marked as read' },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/activity/{id}': {
        get: {
          tags: ['Activity'],
          summary: 'Get ticket activity',
          description: 'Activity log for a ticket. id is the ticketId.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
          ],
          responses: {
            '200': {
              description: 'List of activity items',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      activity: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ActivityItem' },
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '500': {
              description: 'Server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
    },
  };
}

export const openApiSpec = buildSpec();
