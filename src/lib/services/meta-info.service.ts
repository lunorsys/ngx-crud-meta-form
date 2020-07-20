import { Injectable } from '@angular/core';
import { GenericFieldInfo, MetaInfo, MetaInfoTag, ControlType } from '../meta-info/meta-info.model';
import { CrudConfig } from '../models/crud-config';
import { MetaInfoBaseService } from './meta-info-base.service';

@Injectable({
  providedIn: 'root'
})
export class MetaInfoService {

  constructor(
    private crudConfig: CrudConfig,
    private metaInfoBaseService: MetaInfoBaseService
  ) {
    this.metaInfoDefinitions = this.crudConfig.metaInfoDefinitions;
  }

  private metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>;

  public prepareFieldStructure(metaInfoSelector: string): GenericFieldInfo[][][] {
    const metaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
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

  public getMetaInfoInstance(metaInfoSelector: MetaInfoTag): MetaInfo {
    return this.metaInfoDefinitions.get(metaInfoSelector);
  }

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
      ControlType.selectAutocomplete,
      ControlType.checkList,
      ControlType.checkListObject,
      ControlType.select,
      ControlType.selectMulti,
      ControlType.selectMultiObject,
      ControlType.table,
      ControlType.tableMasterDetail
    ].includes(field.type);
  }

  public isFieldForJoin(field: GenericFieldInfo) {
    return [
      ControlType.checkListObjectJoin,
      ControlType.selectMultiObjectJoin,
      ControlType.tableJoin,
    ].includes(field.type);
  }
}
