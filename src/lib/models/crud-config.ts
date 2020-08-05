import { Injectable } from '@angular/core';
import { MetaInfoTag, MetaInfo } from '../meta-info/meta-info.model';
import { ScrollMode } from './crud.model';
import { MatFormFieldAppearance } from '@angular/material/form-field';

@Injectable({
  providedIn: 'root'
}) export class CrudConfig {
  public metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>;
  public baseUrl: string;
  public scrollModeBaseDataTable: ScrollMode;
  public hasAmPmSupport?: boolean;
  public formFieldAppeareance?: MatFormFieldAppearance;
}
