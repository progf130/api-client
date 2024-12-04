import {Logger} from './logger';
import {HttpAxiosWrapper} from './http.axios-wrapper';


export abstract class ApiClient {

  protected readonly REQUEST_PER_SECOND: number;
  protected readonly REQUEST_PER_MINUTE: number;
  protected readonly REQUEST_PER_HOUR: number;

  protected readonly logger: Logger;
  protected readonly httpClient: HttpAxiosWrapper;

  private isProcessing = false;
  private readonly queue: (() => Promise<any>)[] = [];
  protected nextAvailableRequestTime: number = 0;
  protected requestTimes: number[] = [];

  protected constructor(options: {
      apiKey: string,
      requestPerSecond?: number,
      requestPerMinute?: number,
      requestPerHour?: number,
    },
    logger: Logger) {

    this.REQUEST_PER_SECOND = options.requestPerSecond ?? Number.MAX_SAFE_INTEGER;
    this.REQUEST_PER_MINUTE = options.requestPerMinute ?? Number.MAX_SAFE_INTEGER;
    this.REQUEST_PER_HOUR = options.requestPerHour ?? Number.MAX_SAFE_INTEGER;
    this.logger = logger;
    this.httpClient = new HttpAxiosWrapper(logger, options.apiKey);
  }

  public scheduleGetRequest<Request extends Record<string, unknown>, Response>(url: string, params?: Request): Promise<Response> {
    const task = async () => this.httpClient.promisifiedGet<Response>(url, params);

    return new Promise<Response>((resolve, reject) => {
      const queuedTask = async () => task()
        .then((result: Response) => resolve(result))
        .catch((error: Error) => reject(error));
      this.queue.push(queuedTask);
      this.processQueue().then();
    });
  }


  public schedulePostRequest<Request, Response>(url: string, body: Request): Promise<Response> {
    const task = async () => this.httpClient.promisifiedPost<Request, Response>(url, body);

    return new Promise<Response>((resolve, reject) => {
      const queuedTask = async () => task()
        .then((result: Response) => resolve(result))
        .catch((error: Error) => reject(error));
      this.queue.push(queuedTask);
      this.processQueue().then();
    });
  }

  private async processQueue() {

    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        const now = this.getTimestampInSec();
        const waitTime = this.nextAvailableRequestTime - now;
        if (waitTime > 0) {
          this.logger.warn(`Exceeded request limit. Waiting ${waitTime} sec`);
          await this.delay(waitTime);
        }

        this.requestTimes.push(now);
        this.calculateNextAvailableTime();
        await task();
      }
    }

    this.isProcessing = false;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  protected getTimestampInSec() {
    return Math.floor(Date.now() / 1000);
  }

  protected abstract calculateNextAvailableTime(): void;

}
