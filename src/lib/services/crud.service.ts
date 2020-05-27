import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, mergeMap, map } from 'rxjs/operators';
import { MetaInfoBaseService } from './meta-info-base.service';
import { MetaInfoTag, CacheSupportLevel } from '../meta-info/meta-info.model';
import { CRUD_CONFIG, CrudConfig } from '../models/crud-config';
import { CACHE_TOKEN, ICacheService } from '../interfaces/icache.service';

@Injectable({
  providedIn: 'root'
})
export class CrudService {

  private baseUrl = '';

  constructor(private http: HttpClient,
    private metaInfoBaseService: MetaInfoBaseService,
    @Inject(CACHE_TOKEN) private cacheService: ICacheService,
    @Inject(CRUD_CONFIG) private crudConfig: CrudConfig) {

    this.baseUrl = this.crudConfig.baseUrl;
  }

  public getTable(metaInfoSelector: MetaInfoTag, restPath: string = null): Observable<any[]> {
    if (!restPath) {
      const metaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
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

  public get(metaInfoSelector: MetaInfoTag, data: any): Observable<any> {
    const metaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
    if (!metaInfo) {
      return of(null);
    } else {
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
      if (!primaryKeyName) {
        console.error(`Crud: No primary key name found for '${metaInfoSelector}'`);
        return of(null);
      }
      const primaryKey = data[primaryKeyName];
      if (!primaryKey) {
        console.error(`Crud: No valid primary key found for '${metaInfoSelector}'`);
        return of(null);
      }

      if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel === CacheSupportLevel.Complete) {
        return of(this.cacheService.getCachedObject(metaInfoSelector, primaryKey));
      } else {
        const restPath = this.metaInfoBaseService.extractRestPath(metaInfo, data);
        if (!restPath) {
          console.error(`Crud: No valid rest path key found for '${metaInfoSelector}'`);
          return of(null);
        }
        const url = `${this.baseUrl}/${restPath}/${primaryKey}`;
        return this.http.get<any>(url);
      }
    }
  }

  public save(parentMetaInfoSelector: MetaInfoTag, metaInfoSelector: MetaInfoTag, data: any): Observable<any> {
    const metaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
    if (!metaInfo) {
      return of(null);
    }

    let restPath = this.metaInfoBaseService.extractRestPath(metaInfo, data);
    if (!restPath) {
      console.error(`Crud: No restPath found for '${metaInfoSelector}'`);
      return of(null);
    }

    const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found for '${metaInfoSelector}'`);
      return of(null);
    }

    const isCreate = data[primaryKeyName] === null;
    if (!isCreate) {
      restPath = `${restPath}/${data[primaryKeyName]}`;
    }

    const url = `${this.baseUrl}/${restPath}`;
    const request$ = isCreate ? this.http.post<any>(url, data) : this.http.put<any>(url, data);
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

  public delete(metaInfoSelector: MetaInfoTag, data: any): Observable<any> {
    const metaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
    if (!metaInfo) {
      return of(null);
    }

    const restPath = metaInfo.restPath && this.metaInfoBaseService.extractRestPath(metaInfo, data);

    const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found for '${metaInfoSelector}'`);
      return of(null);
    }

    if (restPath) {
      const url = `${this.baseUrl}/${restPath}/${data[primaryKeyName]}`;
      return this.http.delete(url).pipe(
        mergeMap((postResult) => {
          if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
            this.cacheService.deleteCachedObject(metaInfoSelector, data[primaryKeyName]);
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
        this.cacheService.deleteCachedObject(metaInfoSelector, data[primaryKeyName]);
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
    const primaryKey = data?.[primaryKeyName] ? data?.[primaryKeyName] : updateResult?.[primaryKeyName];
    if (!primaryKey) {
      return;
    }
    const parentMetaInfo = parentMetaInfoSelector && this.metaInfoBaseService.getMetaInfoInstance(parentMetaInfoSelector);

    if (parentMetaInfo && this.metaInfoBaseService.hasMasterDetailChildTable(parentMetaInfo)) {
      const parentPrimaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(parentMetaInfo.fields);
      const parentPrimaryKey = updateResult[parentPrimaryKeyName];
      if (parentPrimaryKey) {
        // => POST
        data[parentPrimaryKeyName] = parentPrimaryKey;
        this.cacheService.setCachedObject(metaInfoSelector, primaryKey, data);
      }
    } else {
      this.cacheService.setCachedObject(metaInfoSelector, primaryKey, data);
    }
  }
}

