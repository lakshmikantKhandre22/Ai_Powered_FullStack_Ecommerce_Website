class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Flag for predictable user-facing errors

    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;
