// Vercel serverless function entry point for NestJS application
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe, VersioningType } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const path = require('path');
const fs = require('fs');

// Find the compiled AppModule
const possiblePaths = [
  path.join(__dirname, 'dist', 'src', 'app.module.js'),  // api/dist/src/app.module.js (after copy:api)
  path.join(__dirname, 'dist', 'app.module.js'),  // api/dist/app.module.js (fallback)
  path.join(__dirname, '..', 'dist', 'src', 'app.module.js'),  // ../dist/src/app.module.js (original)
  path.join(__dirname, '..', 'dist', 'app.module.js'),  // ../dist/app.module.js (fallback)
];

let appModule;
let foundPath;

// Try to load the AppModule from compiled files
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    foundPath = p;
    try {
      const loaded = require(p);
      appModule = loaded.AppModule;
      if (appModule) {
        console.log('✅ Found AppModule at:', p);
        break;
      }
    } catch (err) {
      console.warn('⚠️  Failed to load from', p, ':', err.message);
    }
  }
}

if (!appModule) {
  const distPath = path.join(__dirname, 'dist');
  console.error('❌ AppModule not found. Checked paths:', possiblePaths);
  if (fs.existsSync(distPath)) {
    console.error('📂 Available files in api/dist:', fs.readdirSync(distPath));
  } else {
    console.error('📂 api/dist folder not found');
  }
  throw new Error('AppModule not found. Please ensure the build completed successfully.');
}

let cachedApp;

async function createNestApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(appModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  });

  // Set global prefix
  app.setGlobalPrefix('api', { exclude: ['/health/(.*)', '/api-docs/(.*)'] });

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Doctor Appointment Booking')
    .setDescription('Doctor Appointment Booking API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.init();
  cachedApp = app;
  console.log('✅ NestJS app initialized for serverless');
  return app;
}

module.exports = async (req, res) => {
  try {
    const app = await createNestApp();
    const expressApp = app.getHttpAdapter().getInstance();
    return expressApp(req, res);
  } catch (error) {
    console.error('❌ Error handling request:', error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
