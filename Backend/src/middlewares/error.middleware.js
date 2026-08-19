import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode ? error.statusCode : 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    error: {
      code: error.statusCode === 400 ? "BAD_REQUEST" : 
            error.statusCode === 401 ? "UNAUTHORIZED" :
            error.statusCode === 403 ? "FORBIDDEN" :
            error.statusCode === 404 ? "NOT_FOUND" :
            error.statusCode === 409 ? "CONFLICT" : "INTERNAL_ERROR",
      message: error.message
    }
  };

  // Do not expose stack traces to client per PRD
  res.status(error.statusCode).json(response);
};
