import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from '#config/env';
import activityRouter from '#modules/activity/activity.routes';
import notificationRouter from '#modules/notification/notification.routes';
import propertyRouter from '#modules/property/property.routes';
import ticketRouter from '#modules/ticket/ticket.routes';
import unitRouter from '#modules/unit/unit.routes';
import userRouter from '#modules/user/user.routes';
import { openApiSpec } from '#openapi/spec';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import { rateLimiterMiddleware } from '#utils/rateLimiter';

const app: Express = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan('combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }),
);

const instanceId = process.env.INSTANCE_ID ?? process.env.HOSTNAME ?? 'local';

app.get('/', (req, res) => {
  logger.info('Hello from Property Maintenance API!');
  res.status(200).json({
    message: 'Hello from Property Maintenance API!',
    instance: instanceId,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is healthy',
    instance: instanceId,
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Property Maintenance API is running!!',
    instance: instanceId,
  });
});
app.get('/docs/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(openApiSpec);
});

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    swaggerOptions: {
      docExpansion: 'list',
      displayRequestDuration: true,
      persistAuthorization: true,
      url: '/docs/openapi.json',
    },
  }),
);

app.use('/api/v1', rateLimiterMiddleware);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/tickets', ticketRouter);
app.use('/api/v1/properties', propertyRouter);
app.use('/api/v1/units', unitRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(
  (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
  ) => {
    logger.error(`Error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.message,
      });
    }

    const message =
      config.nodeEnv === 'production' ? 'Something went wrong' : err.message;
    return res.status(500).json({
      error: message,
    });
  },
);

export default app;
