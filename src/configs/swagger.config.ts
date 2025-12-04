import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('HaloLight API')
    .setDescription(
      'HaloLight enterprise backend API - NestJS 11+ implementation providing robust services for multi-framework admin dashboard solutions',
    )
    .setVersion('1.0.0')
    .setContact('h7ml', 'https://github.com/h7ml', 'h7ml@qq.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Roles', 'Role management endpoints')
    .addTag('Permissions', 'Permission management endpoints')
    .addTag('Teams', 'Team management endpoints')
    .addTag('Documents', 'Document management endpoints')
    .addTag('Files', 'File management endpoints')
    .addTag('Folders', 'Folder management endpoints')
    .addTag('Calendar', 'Calendar events management endpoints')
    .addTag('Notifications', 'Notification management endpoints')
    .addTag('Messages', 'Messaging and conversations endpoints')
    .addTag('Dashboard', 'Dashboard statistics and analytics endpoints')
    .addServer('http://localhost:3000', 'Local development server')
    .addServer('https://halolight-api-nestjs.h7ml.cn', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'HaloLight API Documentation',
    customfavIcon: 'https://halolight.h7ml.cn/favicon.ico',
    // Load Swagger UI assets from CDN to avoid missing static files in serverless
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0 }
      .swagger-ui .info .title { font-size: 36px }
    `,
  });
}
