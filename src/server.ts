import logger from '#utils/logger';
import app from './app';

const PORT = Number(process.env.PORT) || 8000;

process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`, {
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  logger.info(`API server is running on http://localhost:${PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.error(`Server error: ${error.message}`);
  }
  process.exit(1);
});

const shutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
