export enum ErrorCodes {
  CONNECTION_ERROR = 'ConnectionError',
  INCORRECT_REQUEST = 'IncorrectRequest',
  CODE_NOT_EXISTS = 'CodeNotExists',
}

export type ResponseBodyErrors = {
  errors: ResponseError[];
}

export type ResponseError = {
  code: ErrorCodes,
  message: string;
};

export type ResponseBodyWarning = {
  message: string;
}

export class HttpClientError extends Error {
  private readonly errors: ResponseError[];

  constructor(message: string, errors?: ResponseError[]) {
    super(message);
    this.name = 'HttpClientError';
    this.errors = errors ?? [];
  }

  public getErrors(): ResponseError[] {
    return this.errors;
  }
}
