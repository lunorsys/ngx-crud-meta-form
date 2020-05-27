import { InjectionToken } from '@angular/core';
import { MetaInfoTag, MetaInfo } from '../meta-info/meta-info.model';

export class CrudConfig {
  public metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>;
  public baseUrl: string;

  constructor(crudConfig: CrudConfig) {
    this.metaInfoDefinitions = crudConfig.metaInfoDefinitions;
    this.baseUrl = crudConfig.baseUrl;
  }
}

export const CRUD_CONFIG = new InjectionToken<CrudConfig>('CRUD_CONFIG');
