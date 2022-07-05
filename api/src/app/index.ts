import express, { ErrorRequestHandler, RequestHandler } from 'express';
import helmet from 'helmet';
import 'express-async-errors';
import { createLogger } from 'util/logger';
import { registerRoutes } from 'app/api/routes';

const joiErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const joiError = err.error;
  if (joiError) {
    next({
      statusCode: 400,
      message: joiError.message,
    });
  } else {
    next(err);
  }
};

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    message,
  });
};

const notFoundHandler: RequestHandler = (req, res, next) => {
  const err: any = new Error(`Not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

export default class App {
  public static server = express();
  public static logger = createLogger('api');

  public static async init() {
    const port = App.getPort();

    App.server.use(express.json());
    App.server.use(helmet());

    registerRoutes();

    App.server.all('*', notFoundHandler);
    App.server.use(joiErrorHandler);
    App.server.use(errorHandler);

    App.server.listen(port, () => {
      App.logger.info(`API listening on port ${port}`);
    });
  }

  public static getPort(): number {
    return Number(process.env.PORT);
  }
}
