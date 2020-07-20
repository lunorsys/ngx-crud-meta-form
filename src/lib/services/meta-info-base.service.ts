import { Injectable } from '@angular/core';
//
import { MetaInfo, GenericFieldInfo, MetaInfoTag, ControlType } from '../meta-info/meta-info.model';
import { CrudConfig } from '../models/crud-config';

@Injectable({
  providedIn: 'root'
})
export class MetaInfoBaseService {

  constructor(private crudConfig: CrudConfig) {
    this.metaInfoDefinitions = this.crudConfig.metaInfoDefinitions;
  }
  private metaInfoDefinitions: Map<MetaInfoTag | MetaInfoTag, MetaInfo>;

  public static getMetaInfoInstance(metaInfoSelector: MetaInfoTag, metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>): MetaInfo {
    const metaInfo = metaInfoDefinitions.get(metaInfoSelector);
    if (!metaInfo) {
      console.error(`Crud: No metaInfo found for '${metaInfoSelector}'`);
    }
    return metaInfo;
  }

  public normalizeRestPath(metaInfo: MetaInfo): string {
    let restPath = '';
    if (metaInfo.restPath) {
      const restPathArr = metaInfo.restPath.split('/');
      restPathArr.forEach((part: string, index: number) => {
        if (part.startsWith('{') && part.endsWith('}')) {
          restPathArr[index] = null;
        }
      });
      restPath = restPathArr.filter(Boolean).join('/');
    }
    return restPath;
  }

  public extractRestPath(metaInfo: MetaInfo, parentKeyValue: any): string {
    if (metaInfo.restPath) {
      if (metaInfo.restPath.includes('{')) {

        const restPathArr = metaInfo.restPath.split('/');
        restPathArr.forEach((part: string, index: number) => {
          if (part.startsWith('{') && part.endsWith('}')) {
            restPathArr[index] = parentKeyValue;
          }
        });
        if (restPathArr.some((path: string) => path === undefined)) {
          return null;
        } else {
          return restPathArr.filter(Boolean).join('/');
        }
      } else {
        return metaInfo.restPath;
      }
    } else {
      console.error(`Crud: There is not rest path defined for '${metaInfo.title}'`);
    }

    return metaInfo.restPath;
  }

  public getPrimaryKeyName(fields: GenericFieldInfo[]): string {
    const primaryKeyName = fields.find(field => field.isPrimaryKey)?.name;
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found`);
    }
    return primaryKeyName;
  }

  public getPrimaryKeyValue(metaInfoSelector: MetaInfoTag, data: any): any {
    const metaInfo = this.getMetaInfoInstance(metaInfoSelector);
    const primaryKeyName = metaInfo?.fields?.find(field => field.isPrimaryKey)?.name;
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found`);
      return null;
    } else {
      return data?.[primaryKeyName];
    }
  }

  public getMetaInfoInstance(metaInfoSelector: MetaInfoTag): MetaInfo {
    const metaInfo = this.metaInfoDefinitions.get(metaInfoSelector);
    if (!metaInfo) {
      console.error(`Crud: No metaInfo found for '${metaInfoSelector}'`);
    }
    return metaInfo;
  }

  public hasMasterDetailChildTable(metaInfo: MetaInfo): boolean {
    return metaInfo.fields.some((control) => control.type === ControlType.tableMasterDetail);
  }

}
