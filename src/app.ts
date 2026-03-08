import cookieParser from 'cookie-parser';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import morgan from 'morgan';
import { config } from '#config/env';
import activityRouter from '#modules/activity/activity.routes';

import notificationRouter from '#modules/notification/notification.routes';
import propertyRouter from '#modules/property/property.routes';
import ticketRouter from '#modules/ticket/ticket.routes';
import userRouter from '#modules/user/user.routes';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import { rateLimiterMiddleware } from '#utils/rateLimiter';

const app: Express = express();
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

app.use('/api/v1', rateLimiterMiddleware);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/tickets', ticketRouter);
app.use('/api/v1/properties', propertyRouter);

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
