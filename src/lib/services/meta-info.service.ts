import { Injectable } from '@angular/core';
import { GenericFieldInfo, MetaInfo, MetaInfoTag, ControlType } from '../meta-info/meta-info.model';
import { CrudConfig } from '../models/crud-config';

@Injectable({
  providedIn: 'root'
})
export class MetaInfoService {

  constructor(
    private crudConfig: CrudConfig
  ) {
    this.metaInfoDefinitions = this.crudConfig.metaInfoDefinitions;
  }

  private metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>;

  public prepareFieldStructure(metaInfoSelector: string): GenericFieldInfo[][][] {
    const metaInfo = this.getMetaInfoInstance(metaInfoSelector);
    const updateFields = this.getUpdateFields(metaInfo.fields);
    const fieldStructure = this.getFieldStructure(updateFields);
    return fieldStructure;
  }

  public getFieldStructure(updateFields: GenericFieldInfo[]): GenericFieldInfo[][][] {
    const fieldStructure: GenericFieldInfo[][][] = [];
    let fieldGroup: GenericFieldInfo[][] = [];
    let fieldRow: GenericFieldInfo[] = [];

    updateFields.forEach(field => {
      const formatOption = field.formatOption;

      // starts a new row?
      if ((formatOption?.beginFieldRow || formatOption?.beginFieldGroup) && fieldRow.length) {
        fieldGroup.push(fieldRow);
        fieldRow = [];
      }

      // starts a new group?
      if (formatOption?.beginFieldGroup && fieldGroup.length) {
        fieldStructure.push(fieldGroup);
        fieldGroup = [];
        fieldRow = [];
      }

      fieldRow.push(field);
    });

    if (fieldRow.length) {
      fieldGroup.push(fieldRow);
    }

    if (fieldGroup.length) {
      fieldStructure.push(fieldGroup);
    }

    return fieldStructure;
  }

  public getUpdateFields(fields: GenericFieldInfo[]): GenericFieldInfo[] {
    const filteredFields = fields.filter(field => {
      return this.isFormFieldVisible(field);
    });
    return filteredFields;
  }

  public isFormFieldVisible(field: GenericFieldInfo): boolean {
    return field && (field.isFormControl || field.isFormControl === undefined && !field.isPrimaryKey);
  }

  public getflexParameter(field: GenericFieldInfo): string {
    return field?.formatOption?.formFlexParameter ?? null;
  }

  // public getMetaInfoInstance(metaInfoSelector: MetaInfoTag): MetaInfo {
  //   return this.metaInfoDefinitions.get(metaInfoSelector);
  // }

  public getFormDialogWidth(metaInfo: MetaInfo): string {
    return metaInfo && metaInfo.formWidth ? metaInfo.formWidth : '500px';
  }

  public hasTabs(metaInfo: MetaInfo): boolean {
    return metaInfo.tabPages && metaInfo.tabPages.length > 0;
  }

  public getDisabled(editAllowedList: string[], field: GenericFieldInfo): boolean {
    return (field.readonly || (editAllowedList && !editAllowedList.includes(field.name)));
  }

  public isFieldForLookup(field: GenericFieldInfo) {
    return [
      ControlType.SelectAutocomplete,
      ControlType.CheckList,
      ControlType.CheckListObject,
      ControlType.Select,
      ControlType.SelectMulti,
      ControlType.SelectMultiObject,
      ControlType.Table,
      ControlType.TableMasterDetail
    ].includes(field.type);
  }

  public isFieldForJoin(field: GenericFieldInfo) {
    return [
      ControlType.CheckListObjectJoin,
      ControlType.SelectMultiObjectJoin,
      ControlType.TableJoin,
    ].includes(field.type);
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

  public getMetaInfoInstance(metaInfoSelector: MetaInfoTag | string): MetaInfo {
    const metaInfo = this.metaInfoDefinitions.get(metaInfoSelector);
    if (!metaInfo) {
      console.error(`Crud: No metaInfo found for '${metaInfoSelector}'`);
    }
    return metaInfo;
  }

  public hasMasterDetailChildTable(metaInfo: MetaInfo): boolean {
    return metaInfo.fields.some((control) => control.type === ControlType.TableMasterDetail);
  }
}
