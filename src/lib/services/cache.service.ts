// import { WEB_SOCKET_TOKEN } from './../interfaces/iwebsocket.service';
import { Injectable, OnDestroy, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, BehaviorSubject, Subject, throwError, of } from 'rxjs';
import { share, takeUntil, catchError } from 'rxjs/operators';
//
import { MetaInfoBaseService } from './meta-info-base.service';
import { MetaInfo, MetaInfoTag, CacheSupportLevel } from '../meta-info/meta-info.model';
import { SnackBarParameter, SnackBarType, SnackBarService } from './snack-bar.service';
// import { CrudAction, WebSocketCacheData } from '../models/crud.model';
// import { IWebSocketService } from '../interfaces/iwebsocket.service';
import { ICacheService } from '../interfaces/icache.service';
import { CrudConfig } from '../models/crud-config';

@Injectable({
  providedIn: 'root'
})
export class CacheService implements OnDestroy, ICacheService {
  private baseUrl = '';
  private cachedTables = new Map<MetaInfoTag, any[]>();
  private cacheRestPathes = new Map<MetaInfoTag, string>();
  private cacheDataAvailable$ = new BehaviorSubject(false);
  private ngUnsubscribe = new Subject();
  private metaInfoDefinitions: Map<MetaInfoTag | MetaInfoTag, MetaInfo>;

  constructor(private http: HttpClient,
    private metaInfoBaseService: MetaInfoBaseService,
    private snackBarService: SnackBarService,
    private crudConfig: CrudConfig /*,
    @Inject(WEB_SOCKET_TOKEN) @Optional() private webSocketService: IWebSocketService */) {

    this.baseUrl = this.crudConfig.baseUrl;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public initializeCache(metaInfoDefinitions: Map<MetaInfoTag | MetaInfoTag, MetaInfo>, token: string = null): Observable<any> {
    this.metaInfoDefinitions = metaInfoDefinitions;
    this.cacheRestPathes = this.fillCachedRestPathes();
    const initializationDone$ = this.fillCachedTables(this.cacheRestPathes, true);

    // if (token) {
    //   this.subscribeCacheData(initializationDone$, token);
    // }
    return initializationDone$;
  }

  // private subscribeCacheData(initializationDone$: Observable<any[]>, token: string): void {
  //   if (!this.webSocketService) {
  //     return;
  //   }
  //   initializationDone$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
  //     const selectors = Array.from(this.cacheRestPathes.keys());
  //     selectors.forEach((selector) => {
  //       this.webSocketService.watchSubsciption<WebSocketCacheData>(`topic/${selector}`, token)
  //         .pipe(takeUntil(this.ngUnsubscribe)).subscribe((webSocketResult) => {
  //           if (webSocketResult) {
  //             console.log(`Websocket result: ${JSON.stringify(webSocketResult)}`);

  //             switch (webSocketResult.action) {
  //               case CrudAction.Insert:
  //                 break;
  //               case CrudAction.Update:
  //                 break;
  //               case CrudAction.Delete:
  //                 break;
  //             }
  //           }
  //         });
  //     });
  //   });
  // }

  public get isCacheAvailable(): Observable<boolean> {
    return this.cacheDataAvailable$.pipe(share());
  }

  private fillCachedRestPathes(): Map<MetaInfoTag, string> {
    const cacheRestPathes = new Map<MetaInfoTag, string>();
    this.metaInfoDefinitions.forEach((metaInfo, key) => {
      if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None && !this.cacheRestPathes.has(key)) {
        const restPath = this.metaInfoBaseService.normalizeRestPath(metaInfo);
        cacheRestPathes.set(key, restPath);
      }
    });
    return cacheRestPathes;
  }

  private fillCachedTables(restPathesForCache: Map<MetaInfoTag, string>, isInitializingCache: boolean): Observable<any[]> {
    const requestedCacheData$ = this.prepareRestPathesForCachedTables(restPathesForCache);
    const initializationDone$ = this.receiveCacheTableData(requestedCacheData$);

    const selectors: MetaInfoTag[] = Array.from(restPathesForCache.keys());
    this.handleReceivedCacheData(initializationDone$, selectors, isInitializingCache);
    return initializationDone$;
  }

  private receiveCacheTableData(initializationArr$: Observable<any>[]): Observable<any[]> {
    return forkJoin<any>(initializationArr$).pipe(
      share(),
      catchError((err) => {
        if (!err.status || err.status === 401) {
          return of([]);
        } else {
          const error = err.error.message || err.statusText;
          return throwError(error);
        }
      })
    );
  }

  private prepareRestPathesForCachedTables(cachedRestPathes: Map<string, string>) {
    const requestedCacheData$: Observable<any>[] = [];
    cachedRestPathes.forEach((restPath) => {
      const request = this.getRequest(restPath).pipe(
        share(),
        catchError((err) => {
          if (err.status === 401 || err.status === 403) {
            return of([]);
          } else {
            const error = err.message && err.error.message || err.statusText;
            return throwError(error);
          }
        }));
      requestedCacheData$.push(request);
    });
    return requestedCacheData$;
  }

  private handleReceivedCacheData(receivedCacheData$: Observable<any[] | unknown[]>, selectors: string[], isInitializingCache: boolean) {
    if (!selectors.length) {
      this.cacheDataAvailable$.next(true);
      return;
    }

    receivedCacheData$.pipe(share(), takeUntil(this.ngUnsubscribe)).subscribe((cacheResult) => {
      cacheResult.forEach((cacheInitData: any[], index: number) => {
        this.cachedTables.set(selectors[index], cacheInitData);
      });
      if (isInitializingCache) {
        this.cacheDataAvailable$.next(true);
      }
    }, (err) => {
      if (err && err.state !== 401) {
        const parameter: SnackBarParameter = {
          message: isInitializingCache ? 'Error occurs while starting application!' : 'Error occurs while updating cache!',
          type: SnackBarType.warn
        };
        this.snackBarService.openSnackbar(parameter);
      }
    });
  }

  public getCachedTable(metaInfoSelector: MetaInfoTag): any[] {
    const metaInfo: MetaInfo = this.metaInfoDefinitions.get(metaInfoSelector);
    if (metaInfo) {
      const cacheContent = this.cachedTables.get(metaInfoSelector);
      if (!cacheContent) {
        console.error(`Crud: No cache content found for '${metaInfoSelector}'`);
      }
      return cacheContent;
    } else {
      console.error(`Crud: No meta info data found for '${metaInfoSelector}'`);
      return null;
    }
  }

  public getTableMasterDetail(metaInfoSelector: MetaInfoTag, primaryParentKeyName: string,
    primaryParentKey: number): any[] {
    const filteredTable = this.getCachedTable(metaInfoSelector).filter((cachedTableItem) => {
      return cachedTableItem[primaryParentKeyName] === primaryParentKey;
    });

    return filteredTable;
  }

  public setCachedTable(metaInfoSelector: MetaInfoTag, data: any): void {
    this.cachedTables.set(metaInfoSelector, data);
  }

  private getRequest(restPath: string): Observable<any[]> {
    const urlPath = `${this.baseUrl}/${restPath}`;
    return this.http.get<any>(urlPath);
  }

  public getCachedObject(metaInfoSelector: MetaInfoTag, keyValue: number): any {
    const metaInfo = this.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
      const cachedObject = this.getCachedTable(metaInfoSelector).find(tableItem => {
        return tableItem[primaryKeyName] === keyValue;
      });
      return cachedObject;
    } else {
      return null;
    }
  }

  public setCachedObject(metaInfoSelector: MetaInfoTag, keyValue: number, data: any): void {
    const metaInfo = this.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
      const table = this.getCachedTable(metaInfoSelector);
      const index = table.findIndex((tableItem: any) => tableItem[primaryKeyName] === keyValue);
      if (index === -1) {
        table.push(data);
      } else {
        table[index] = data;
      }
    }
  }

  public deleteCachedObject(metaInfoSelector: MetaInfoTag, keyValue: number): void {
    const metaInfo = this.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
      const table = this.getCachedTable(metaInfoSelector);
      const index = table.findIndex((tableItem: any) => tableItem[primaryKeyName] === keyValue);
      if (index > -1) {
        table.splice(index, 1);
      }
    }
  }

  public getMetaInfoInstance(metaInfoSelector: MetaInfoTag): MetaInfo {
    return this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
  }

  public refreshConnectedTables(connectedTables: MetaInfoTag[]): Observable<any> {
    const connectedRestPathes = new Map<MetaInfoTag, string>();

    connectedTables.forEach((metaInfoTag: MetaInfoTag) => {
      const restPath = this.cacheRestPathes.get(metaInfoTag);
      connectedRestPathes.set(metaInfoTag, restPath);
    });

    return this.fillCachedTables(connectedRestPathes, false);
  }

  public removeCachedData() {
    this.cacheDataAvailable$.next(false);
    this.cachedTables.clear();
    this.cacheRestPathes.clear();
  }
}
