import {Logger} from './logger';
import axios, {AxiosError, AxiosHeaders} from 'axios';
import {ErrorCodes, HttpClientError, ResponseBodyErrors, ResponseBodyWarning} from './http-client.error';
import {HttpStatus} from './http-status.enum';


export class HttpAxiosWrapper {

  private readonly logger: Logger;
  private readonly API_KEY: string;

  constructor(logger: Logger, API_KEY: string) {
    this.logger = logger;
    this.API_KEY = API_KEY;
  }

  public promisifiedGet<Res>(url: string, params?: Record<string, unknown>): Promise<Res> {

    const queryParams = params ? `?${this.createURLSearchParams(params).toString()}` : '';
    const uri = url + queryParams;

    this.logger.info(`GET ${uri}`);
    return new Promise((resolve, reject) => {
      axios.get<Res>(uri, {
        headers: this.getHeaders(),
      })
        .then(response => resolve(response.data))
        .catch(error => reject(this.catchAxiosError(error)));
    });
  }

  private createURLSearchParams(params: Record<string, unknown>): URLSearchParams {
    const urlSearchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((val) => {
          urlSearchParams.append(key, `${val}`);
        });
      } else if (value !== undefined) {
        urlSearchParams.append(key, `${value}`);
      }
    });
    return urlSearchParams;
  }

  private getHeaders(): AxiosHeaders {
    return new AxiosHeaders({
      'X-API-KEY': this.API_KEY,
      'Content-Type': 'application/json',
    });
  }

  private catchAxiosError<T extends ResponseBodyErrors & ResponseBodyWarning>(error: AxiosError<T>): HttpClientError {

    const errorMessage = `Запрос ${error.config?.url}-${error.config?.method}`;

    if (error.status && error.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const message = `status:${error.status}, code:${error.code}, message:${error.message}`;
      return new HttpClientError(errorMessage, [
        {
          code: ErrorCodes.CONNECTION_ERROR,
          message,
        },
      ]);
    }

    if (error.response?.data?.errors) {
      return new HttpClientError(errorMessage, error.response?.data?.errors);
    }

    if (error.response?.data?.message) {
      return new HttpClientError(errorMessage, [
        {
          code: ErrorCodes.CODE_NOT_EXISTS,
          message: error.response.data.message,
        },
      ]);
    }

    return new HttpClientError(errorMessage);
  }

  public promisifiedPost<Req, Res>(url: string, data: Req): Promise<Res> {

    this.logger.info(`POST ${url}`, JSON.stringify(data, null, 2));
    return new Promise((resolve, reject) => {
      axios.post(url, data, {
        headers: this.getHeaders(),
      })
        .then(response => resolve(response.data))
        .catch(error => reject(this.catchAxiosError(error)));
    });
  }

}
