import { Injectable, Inject } from '@angular/core';
//
import { MetaInfo, GenericFieldInfo, MetaInfoTag, ControlType } from '../meta-info/meta-info.model';
import { MetaInfoExtraDataService } from './meta-info-extra-data.service';
import { CrudConfig, CRUD_CONFIG } from '../models/crud-config';

@Injectable({
  providedIn: 'root'
})
export class MetaInfoBaseService {
  private metaInfoDefinitions: Map<MetaInfoTag | MetaInfoTag, MetaInfo>;

  constructor(private metaInfoExtraDataService: MetaInfoExtraDataService,
    @Inject(CRUD_CONFIG) private crudConfig: CrudConfig) {
    this.metaInfoDefinitions = this.crudConfig.metaInfoDefinitions;
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

  public extractRestPath(metaInfo: MetaInfo, data: any = null): string {
    if (metaInfo.restPath) {
      if (metaInfo.restPath.includes('{')) {
        const restPathArr = metaInfo.restPath.split('/');
        restPathArr.forEach((part: string, index: number) => {
          if (part.startsWith('{') && part.endsWith('}')) {
            const extraDataKey = part.substr(1, part.length - 2);
            const restPathId = extraDataKey.length ? this.metaInfoExtraDataService.getExtraData(extraDataKey) : null;

            if (restPathId) {
              restPathArr[index] = restPathId;
            } else if (data) {
              restPathArr[index] = data[extraDataKey];
            } else {
              restPathArr[index] = null;
            }
          }
        });
        if (restPathArr.some((path: string) => path === undefined)) {
          return null;
        }

        return restPathArr.filter(Boolean).join('/');
      } else {
        return metaInfo.restPath;
      }
    } else {
      console.error(`Crud: There is not rest path defined for '${metaInfo.title}'`);
    }

    return metaInfo.restPath;
  }

  public getPrimaryKeyName(fields: GenericFieldInfo[]): string {
    const primaryKeyField = fields.find(field => field.isPrimaryKey);
    let primaryKeyName: string = null;
    if (primaryKeyField) {
      primaryKeyName = primaryKeyField.name;
    }
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found`);
    }
    return primaryKeyName;
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
