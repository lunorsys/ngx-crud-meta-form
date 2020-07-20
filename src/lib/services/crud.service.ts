import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, mergeMap, map } from 'rxjs/operators';
import { MetaInfoTag, CacheSupportLevel, MetaInfo } from '../meta-info/meta-info.model';
import { CrudConfig } from '../models/crud-config';
import { CACHE_TOKEN, ICacheService } from '../interfaces/icache.service';
import { MetaInfoService } from './meta-info.service';

@Injectable({
  providedIn: 'root'
})
export class CrudService {

  private baseUrl = '';

  public static getMetaInfoInstance(metaInfoSelector: MetaInfoTag, metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>): MetaInfo {
    const metaInfo = metaInfoDefinitions.get(metaInfoSelector);
    if (!metaInfo) {
      console.error(`Crud: No metaInfo found for '${metaInfoSelector}'`);
    }
    return metaInfo;
  }

  constructor(private http: HttpClient,
    private metaInfoService: MetaInfoService,
    @Inject(CACHE_TOKEN) private cacheService: ICacheService,
    private crudConfig: CrudConfig) {

    this.baseUrl = this.crudConfig.baseUrl;
  }

  public getTable(metaInfoSelector: MetaInfoTag, restPath: string = null): Observable<any[]> {
    if (!restPath) {
      const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
      restPath = metaInfo.restPath;
    }

    if (!restPath) {
      console.error(`Crud: no restPath for '${metaInfoSelector}' found`);
    }
    const url = `${this.baseUrl}/${restPath}`;
    return this.http.get<any>(url).pipe(
      tap((data) => this.cacheService.setCachedTable(metaInfoSelector, data))
    );
  }

  public getValue(metaInfoSelector: MetaInfoTag, lookupId: any): any {
    const data = this.cacheService.getCachedTable(metaInfoSelector);
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    const primaryKeyName = metaInfo?.fields && this.metaInfoService.getPrimaryKeyName(metaInfo.fields);
    return primaryKeyName && data.find((item) => item[primaryKeyName] === lookupId);
  }

  public get(parentMetaInfoSelector: MetaInfoTag, metaInfoSelector: MetaInfoTag, data: any, parentData: any): Observable<any> {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    if (!metaInfo) {
      console.error(`Crud: No primary key name found for '${metaInfoSelector}'`);
      return of(null);
    } else {
      const primaryKeyValue = this.getPrimaryKeyValue(metaInfoSelector, data);

      // if (!primaryKey) {
      //   // console.error(`Crud: No valid primary key found for '${metaInfoSelector}'`);
      //   return of(null);
      // }

      if (primaryKeyValue && metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel === CacheSupportLevel.Complete) {
        return of(this.cacheService.getCachedObject(metaInfoSelector, primaryKeyValue));
      } else {
        const parentPrimaryKeyValue = this.getPrimaryKeyValue(parentMetaInfoSelector, parentData);
        const restPath = this.metaInfoService.extractRestPath(metaInfo, parentPrimaryKeyValue);
        if (!restPath) {
          console.error(`Crud: No valid rest path key found for '${metaInfoSelector}'`);
          return of(null);
        }
        const url = `${this.baseUrl}/${restPath}/${primaryKeyValue}`;
        return this.http.get<any>(url);
      }
    }
  }

  public save(parentMetaInfoSelector: MetaInfoTag, metaInfoSelector: MetaInfoTag, data: any, parentData: any): Observable<any> {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    if (!metaInfo) {
      return of(null);
    }

    const primaryKeyName = this.metaInfoService.getPrimaryKeyName(metaInfo.fields);
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found for '${metaInfoSelector}'`);
      return of(null);
    }

    const parentPrimaryKeyValue = parentMetaInfoSelector && this.getPrimaryKeyValue(parentMetaInfoSelector, parentData);
    const restPath = this.metaInfoService.extractRestPath(metaInfo, parentPrimaryKeyValue);
    if (!restPath) {
      console.error(`Crud: No restPath found for '${metaInfoSelector}'`);
      return of(null);
    }

    let url = '';
    let request$ = null;
    if (data[primaryKeyName]) {
      url = `${this.baseUrl}/${restPath}/${data[primaryKeyName]}`;
      request$ = this.http.put<any>(url, data);
    } else {
      url = `${this.baseUrl}/${restPath}`;
      request$ = this.http.post<any>(url, data);
    }

    return request$.pipe(
      mergeMap((postResult) => {
        if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
          this.setCacheData(parentMetaInfoSelector, metaInfoSelector, data, primaryKeyName, postResult);
        }
        if (metaInfo.connectedCacheTables) {
          return this.cacheService.refreshConnectedTables(metaInfo.connectedCacheTables).pipe(
            map(() => postResult)
          );
        } else {
          return of(postResult || {});
        }
      })
    );
  }

  public delete(parentMetaInfoSelector: MetaInfoTag, metaInfoSelector: MetaInfoTag, data: any, parentData: any): Observable<any> {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    if (!metaInfo) {
      return of(null);
    }

    let parentPrimaryKeyValue = null;
    if (parentMetaInfoSelector) {
      const parentMetaInfo = this.metaInfoService.getMetaInfoInstance(parentMetaInfoSelector);
      parentPrimaryKeyValue = this.getPrimaryKeyValue(parentMetaInfoSelector, parentData);
    }
    const primaryKeyValue = this.getPrimaryKeyValue(metaInfoSelector, data);
    const restPath = this.metaInfoService.extractRestPath(metaInfo, parentPrimaryKeyValue);
    if (restPath) {
      const url = `${this.baseUrl}/${restPath}/${primaryKeyValue}`;
      return this.http.delete(url).pipe(
        mergeMap((postResult) => {
          if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
            this.cacheService.deleteCachedObject(metaInfoSelector, primaryKeyValue);
          }
          if (metaInfo.connectedCacheTables) {
            return this.cacheService.refreshConnectedTables(metaInfo.connectedCacheTables).pipe(
              map(() => postResult)
            );
          } else {
            return of(postResult || {});
          }
        }));
    } else {
      if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
        this.cacheService.deleteCachedObject(metaInfoSelector, primaryKeyValue);
      }
      if (metaInfo.connectedCacheTables) {
        return this.cacheService.refreshConnectedTables(metaInfo.connectedCacheTables);
      } else {
        return of({});
      }
    }
  }

  private setCacheData(parentMetaInfoSelector: MetaInfoTag, metaInfoSelector: MetaInfoTag, data: any,
    primaryKeyName: string, updateResult: any): void {
    const primaryKeyValue = data?.[primaryKeyName] ? data?.[primaryKeyName] : updateResult?.[primaryKeyName];
    if (!primaryKeyValue) {
      return;
    }
    const parentMetaInfo = parentMetaInfoSelector && this.metaInfoService.getMetaInfoInstance(parentMetaInfoSelector);
    const parentPrimaryKeyName = parentMetaInfo && this.metaInfoService.getPrimaryKeyName(parentMetaInfo.fields);
    const parentPrimaryKeyValue = parentPrimaryKeyName && updateResult[parentPrimaryKeyName];
    if (parentMetaInfo && this.metaInfoService.hasMasterDetailChildTable(parentMetaInfo)) {
      if (parentPrimaryKeyValue) {
        // => POST
        data[parentPrimaryKeyName] = parentPrimaryKeyValue;
        this.cacheService.setCachedObject(metaInfoSelector, primaryKeyValue, data);
      }
    } else {
      data[primaryKeyName] = primaryKeyValue;
      this.cacheService.setCachedObject(metaInfoSelector, primaryKeyValue, data);
    }
  }

  private getPrimaryKeyValue(metaInfoSelector: MetaInfoTag, srcData: any): any {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    const primaryKeyName = metaInfo?.fields?.find(field => field.isPrimaryKey)?.name;
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found`);
      return null;
    } else {
      return srcData?.[primaryKeyName];
    }
  }
}

