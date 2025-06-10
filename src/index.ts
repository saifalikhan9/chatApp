import express, { Request, Response, NextFunction, Application } from "express";
import router from "./routes";
import { createServer, Server as HttpServer } from "http";
import { setupWebSocket } from "./lib/websoket";
import { configDotenv } from "dotenv";
import cors, { CorsOptions } from "cors";
import { config } from "./lib/config";
import {
  CustomError,
  ErrorResponse,
  HealthCheckResponse,
  NotFoundResponse,
  ValidationError,
  CastError,
} from "./lib/types";

configDotenv();

const app: Application = express();

// CORS configuration with error handling
const corsOptions: CorsOptions = {
  origin: config.WHITELIST_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200
};

try {
  app.use(cors(corsOptions));
} catch (error: unknown) {
  const err = error as Error;
  console.error('CORS configuration error:', err.message);
  process.exit(1);
}

const server: HttpServer = createServer(app);

// JSON parsing with error handling
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));

// Handle JSON parsing errors
app.use((error: CustomError, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('Bad JSON:', error.message);
    res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Please check your request body format'
    } as ErrorResponse);
    return;
  }
  next(error);
});

// API routes
app.use("/api/v1", router);




// Handle 404 errors for undefined routes
app.use((req: Request, res: Response): void => {
  const response: NotFoundResponse = {
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  };
  res.status(404).json(response);
});

// Type guard functions
const isValidationError = (error: CustomError): error is ValidationError => {
  return error.name === 'ValidationError';
};

const isCastError = (error: CustomError): error is CastError => {
  return error.name === 'CastError';
};

// Global error handling middleware
app.use((err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle different types of errors
  if (isValidationError(err)) {
    const response: ErrorResponse = {
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    };
    res.status(400).json(response);
    return;
  }

  if (isCastError(err)) {
    const response: ErrorResponse = {
      error: 'Invalid ID format',
      message: 'The provided ID is not valid'
    };
    res.status(400).json(response);
    return;
  }
  // Default error response
  const statusCode: number = err.statusCode || err.status || 500;
  const response: ErrorResponse = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong on our end' 
      : err.message,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// WebSocket setup with error handling
try {
  setupWebSocket(server);
  console.log('WebSocket setup completed successfully');
} catch (error: unknown) {
  const err = error as Error;
  console.error('WebSocket setup failed:', err.message);
  // Don't exit here as the API might still work without WebSocket
}

const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Server startup with error handling
server.listen(PORT, "0.0.0.0", (err?: Error): void => {
  if (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal: string): void => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  server.close((err?: Error): void => {
    if (err) {
      console.error('Error during server shutdown:', err.message);
      process.exit(1);
    }
    
    console.log('Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout((): void => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

// Handle process termination signals
process.on('SIGTERM', (): void => gracefulShutdown('SIGTERM'));
process.on('SIGINT', (): void => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error): void => {
  console.error('Uncaught Exception:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  
  // Graceful shutdown on uncaught exception
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>): void => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Graceful shutdown on unhandled rejection
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default app;
export { server };