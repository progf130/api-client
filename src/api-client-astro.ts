import {Logger} from './infrastructure/logger';
import {ApiClient} from './infrastructure/api-client';
import {SEC, SEC_IN_HOUR, SEC_IN_MIN} from './infrastructure/const';


export abstract class ApiClientAstro extends ApiClient {

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

    const curSec = this.getTimestampInSec();
    const min = Math.floor(curSec / 60);
    const hour = Math.floor(min / 60);
    const secToCurrentMinute = min * 60;
    const secToCurrentHour = hour * 60 * 60;

    this.requestTimes.filter(it => it >= secToCurrentHour);
    for (const time of this.requestTimes) {
      requestsLastHour++;
      if (time >= secToCurrentMinute && time < secToCurrentMinute + SEC_IN_MIN) {
        requestsLastMinute++;
      }
      if (time === curSec) {
        requestsLastSec++;
      }
    }

    this.nextAvailableRequestTime = curSec;
    this.updateNextAvailableTimeByRequestLastSec(requestsLastSec, curSec);
    this.updateNextAvailableTimeByRequestsLastMin(requestsLastMinute, secToCurrentMinute);
    this.updateNextAvailableTimeByRequestLastsHour(requestsLastHour, secToCurrentHour);
  }

  private updateNextAvailableTimeByRequestLastSec(requestsLastSec: number, curSec: number): void {
    if (requestsLastSec >= this.REQUEST_PER_SECOND) {
      console.log('requestsLastSec', requestsLastSec);
      this.nextAvailableRequestTime = Math.max(
        this.nextAvailableRequestTime,
        curSec + SEC,
      );
    }
  }

  private updateNextAvailableTimeByRequestsLastMin(requestsLastMinute: number, secToCurrentMinute: number): void {
    if (requestsLastMinute >= this.REQUEST_PER_MINUTE) {
      console.log('requestsLastMinute', requestsLastMinute);
      this.nextAvailableRequestTime = Math.max(
        this.nextAvailableRequestTime,
        secToCurrentMinute + SEC_IN_MIN,
      );
    }
  }

  private updateNextAvailableTimeByRequestLastsHour(requestsLastHour: number, secToCurrentHour: number): void {
    if (requestsLastHour >= this.REQUEST_PER_HOUR) {
      console.log('requestsLastHour', requestsLastHour);
      this.nextAvailableRequestTime = Math.max(
        this.nextAvailableRequestTime,
        secToCurrentHour + SEC_IN_HOUR,
      );
    }
  }
}
