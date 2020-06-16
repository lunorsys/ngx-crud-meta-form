import { InjectionToken, Injectable } from '@angular/core';
import { MetaInfoTag, MetaInfo } from '../meta-info/meta-info.model';

@Injectable({
  providedIn: 'root'
}) export class CrudConfig {
  public metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>;
  public baseUrl: string;

  constructor() {
  }
}
