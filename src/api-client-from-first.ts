import {Logger} from './infrastructure/logger';
import {ApiClient} from './infrastructure/api-client';
import {SEC, SEC_IN_HOUR, SEC_IN_MIN} from './infrastructure/const';


export abstract class ApiClientFromFirst extends ApiClient {

  protected constructor(options: {
      apiKey: string,
      requestPerSecond?: number,
      requestPerMinute?: number,
      requestPerHour?: number,
    },
    logger: Logger) {
    super(options, logger);
  }


  protected calculateNextAvailableTime(): void {
    let requestsLastSec = 0;
    let requestsLastMinute = 0;
    let requestsLastHour = 0;
    const now = this.getTimestampInSec();
    const freshRequestTimes: number[] = [];

    for (const time of this.requestTimes) {
      const diff = now - time;

      if (diff > SEC_IN_HOUR) {
        continue;
      }
      freshRequestTimes.push(time);
      requestsLastHour++;
      if (diff < SEC) {
        requestsLastSec++;
      }
      if (diff < SEC_IN_MIN) {
        requestsLastMinute++;
      }
    }

    this.requestTimes = freshRequestTimes;
    this.nextAvailableRequestTime = now;
    this.updateNextAvailableTimeByRequestsLastSec(requestsLastSec);
    this.updateNextAvailableTimeByRequestsLastMin(requestsLastMinute);
    this.updateNextAvailableTimeByRequestLastsHour(requestsLastHour);
  }

  private updateNextAvailableTimeByRequestsLastSec(requestsLastSec: number): void {
    if (requestsLastSec >= this.REQUEST_PER_SECOND) {
      this.nextAvailableRequestTime = Math.max(
        this.nextAvailableRequestTime,
        this.requestTimes[this.requestTimes.length - 1]! + SEC,
      );
    }
  }

  private updateNextAvailableTimeByRequestsLastMin(requestsLastMinute: number): void {
    if (requestsLastMinute >= this.REQUEST_PER_MINUTE) {
      this.nextAvailableRequestTime = Math.max(
        this.nextAvailableRequestTime,
        this.requestTimes[(this.requestTimes.length - 1) - requestsLastMinute]! + SEC_IN_MIN,
      );
    }
  }

  private updateNextAvailableTimeByRequestLastsHour(requestsLastHour: number): void {
    if (requestsLastHour >= this.REQUEST_PER_HOUR) {
      this.nextAvailableRequestTime = Math.max(
        this.nextAvailableRequestTime,
        this.requestTimes[0]! + SEC_IN_HOUR,
      );
    }
  }
}
