import { Observable } from 'rxjs';
//
import { MetaInfo, MetaInfoTag } from '../meta-info/meta-info.model';
import { InjectionToken } from '@angular/core';

export interface ICacheService {

  readonly isCacheAvailable: Observable<boolean>;
  initializeCache(metaInfoDefinitions: Map<MetaInfoTag | MetaInfoTag, MetaInfo>, token: string): Observable<any>;
  getCachedTable(metaInfoSelector: MetaInfoTag): any[];
  getTableMasterDetail(metaInfoSelector: MetaInfoTag, primaryParentKeyName: string,
    primaryParentKey: number): any[];
  setCachedTable(metaInfoSelector: MetaInfoTag, data: any): void;
  getCachedObject(metaInfoSelector: MetaInfoTag, keyValue: number): any;
  setCachedObject(metaInfoSelector: MetaInfoTag, keyValue: number, data: any): void;
  deleteCachedObject(metaInfoSelector: MetaInfoTag, keyValue: number): void;
  getMetaInfoInstance(metaInfoSelector: MetaInfoTag): MetaInfo;
  refreshConnectedTables(connectedTables: MetaInfoTag[]): Observable<any>;
}

export let CACHE_TOKEN = new InjectionToken<ICacheService>('CACHE_TOKEN');
