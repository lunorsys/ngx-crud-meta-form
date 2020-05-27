import { BehaviorSubject } from 'rxjs';
import { InjectionToken } from '@angular/core';

export interface IWebSocketService {
  watchSubsciption<T>(topic: string, token: string): BehaviorSubject<T>;
}

export let WEB_SOCKET_TOKEN = new InjectionToken<IWebSocketService>('WEB_SOCKET_TOKEN');

