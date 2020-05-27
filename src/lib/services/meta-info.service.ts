import { Injectable, OnDestroy, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Globalize from 'globalize/dist/globalize';
import { cloneDeep, isEqual } from 'lodash';
//
import { CrudService } from './crud.service';
import { MetaInfoBaseService } from './meta-info-base.service';
import { MetaInfo, GenericFieldInfo, ControlType, MetaInfoTag, CacheSupportLevel } from '../meta-info/meta-info.model';
import { CRUD_CONFIG, CrudConfig } from '../models/crud-config';
import { CACHE_TOKEN, ICacheService } from '../interfaces/icache.service';

@Injectable({
  providedIn: 'root'
})
export class MetaInfoService implements OnDestroy {
  public static defaultSelectDisplayLine = '-- please select --';

  private ngUnsubscribe = new Subject();
  private numberFormatter: (value: number) => string;
  private metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>;

  constructor(
    private crudService: CrudService,
    private metaInfoBaseService: MetaInfoBaseService,
    @Inject(CRUD_CONFIG) private crudConfig: CrudConfig,
    @Inject(CACHE_TOKEN) private cacheService: ICacheService
  ) {
    this.metaInfoDefinitions = this.crudConfig.metaInfoDefinitions;
    this.numberFormatter = Globalize.numberFormatter();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public getflexParameter(field: GenericFieldInfo): string {
    return field.formatOption && field.formatOption.formFlexParameter ? field.formatOption.formFlexParameter : null;
  }

  public getUpdateFields(fields: GenericFieldInfo[]): GenericFieldInfo[] {
    return fields.filter(field => this.showFormField(field));
  }

  public getSelectData(field: GenericFieldInfo, data: any, value: any): BehaviorSubject<any[]> {
    const listData$ = new BehaviorSubject<any[]>([]);

    if (!field.lookup) {
      return listData$;
    }

    const metaInfoSelector = field && field.lookup && field.lookup.metaInfoSelector;
    const defaultEntry = this.prepareDefaultEntry(field, metaInfoSelector, value);
    const metaInfo = this.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo) {
      if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
        const listData = cloneDeep(this.cacheService.getCachedTable(metaInfoSelector));
        if (defaultEntry) {
          listData.unshift(defaultEntry);
        }
        listData$.next(listData);
      } else {
        const restPath = this.metaInfoBaseService.extractRestPath(metaInfo, data);
        const listDataResult$ = this.crudService.getTable(metaInfoSelector, restPath);
        listDataResult$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData: any[]) => {
          if (defaultEntry) {
            listData.unshift(defaultEntry);
          }
          listData$.next(listData);
        });
      }
    }
    return listData$;
  }

  public getCheckListData(field: GenericFieldInfo, data: any): BehaviorSubject<any[]> {
    const listData$ = new BehaviorSubject<any[]>([]);

    if (!field.lookup) {
      return listData$;
    }

    const metaInfoSelector = field && field.lookup && field.lookup.metaInfoSelector;
    const metaInfo = this.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo) {
      if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
        const listData = this.cacheService.getCachedTable(metaInfoSelector);
        listData$.next(listData);
      } else {
        const restPath = this.metaInfoBaseService.extractRestPath(metaInfo, data);
        const listDataResult$ = this.crudService.getTable(metaInfoSelector, restPath);
        listDataResult$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData: any[]) => {
          listData$.next(listData);
        });
      }
    }
    return listData$;
  }

  private prepareDefaultEntry(field: GenericFieldInfo, metaInfoSelector: MetaInfoTag, value: any): any {
    let defaultEntry = null;
    if (!field.required) {
      const childMetaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
      if (!childMetaInfo) {
        console.error(`Crud: No metaInfo found for '${metaInfoSelector}'`);
      } else {
        const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(childMetaInfo.fields);
        if (!value[primaryKeyName]) {
          defaultEntry = {};
          defaultEntry[primaryKeyName] = null;
        }
      }
    }
    return defaultEntry;
  }

  public getJoinedTableData(parentMetaInfoSelector: MetaInfoTag, metaInfoSelector: MetaInfoTag, data: any): BehaviorSubject<any[]> {
    const listData$ = new BehaviorSubject<any[]>([]);

    const metaInfo = this.getMetaInfoInstance(metaInfoSelector);
    const parentMetaInfo = this.metaInfoDefinitions.get(parentMetaInfoSelector);

    const parentPrimaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(parentMetaInfo.fields);
    if (parentPrimaryKeyName) {
      const parentPrimaryKey = data[parentPrimaryKeyName];
      if (parentMetaInfo && metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
        if (parentPrimaryKey) {
          const listData = this.cacheService.getTableMasterDetail(metaInfoSelector,
            parentPrimaryKeyName, parentPrimaryKey);
          listData$.next(listData);
        } else {
          listData$.next([]);
          // console.error(`Crud: Missing parent primary key value for associtiation '${metaInfoSelector}'`);
        }
      } else {
        if (parentPrimaryKey) {
          const restPath = this.metaInfoBaseService.extractRestPath(metaInfo, data);
          const listDataResult$ = this.crudService.getTable(metaInfoSelector, restPath);
          listDataResult$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData: any[]) => {
            listData$.next(listData);
          });
        } else {
          listData$.next([]);
        }
      }
    } else {
      console.error(`Crud: Missing parent primary key defintion for associtiation '${metaInfoSelector}'`);
    }
    return listData$;
  }

  public setLookupValue(field: GenericFieldInfo, listData: any[], value: any, control: FormControl): void {

    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
      if (primaryKeyName) {
        const selectedItem = listData ? listData.find((item: any) => {
          return item[primaryKeyName] === value;
        }) : {};
        if (selectedItem) {
          control.setValue(selectedItem);
        }
      }
    }
  }

  public setLookupObjectValue(field: GenericFieldInfo, listData: any[], control: FormControl): void {
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      control.setValue(listData);
    }
  }

  public setLookupArrayValue(field: GenericFieldInfo, listData: any[], value: any[], control: FormControl): void {
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields && value) {
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
      if (primaryKeyName) {
        const selectedItems: any[] = listData ? listData.filter((item: any) =>
          value.some(subItem => item[primaryKeyName] === subItem[primaryKeyName])) : [];
        control.setValue(selectedItems);
      }
    }
  }

  public setLookupArrayId(field: GenericFieldInfo, listData: any[], value: any[], control: FormControl): void {
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields && value) {
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
      if (primaryKeyName) {
        const selectedItems: any[] = listData ? listData.filter((item: any) =>
          value.some(id => item[primaryKeyName] === id)) : [];
        control.setValue(selectedItems);
      }
    }
  }

  public getFieldStructure(updateFields: GenericFieldInfo[]): GenericFieldInfo[][][] {
    const fieldStructure: GenericFieldInfo[][][] = [];
    let fieldGroup: GenericFieldInfo[][] = [];
    let fieldRow: GenericFieldInfo[] = [];

    updateFields.forEach(field => {
      const formatOption = field.formatOption;

      // starts a new row?
      if (formatOption) {
        if ((formatOption.beginFieldRow || formatOption.beginFieldGroup) && fieldRow.length > 0) {
          fieldGroup.push(fieldRow);
          fieldRow = [];
        }

        // starts a new group?
        if ((formatOption.beginFieldGroup) && fieldGroup.length > 0) {
          fieldStructure.push(fieldGroup);
          fieldGroup = [];
          fieldRow = [];
        }

        fieldRow.push(field);
      }
    });

    if (fieldRow.length) {
      fieldGroup.push(fieldRow);
    }

    if (fieldGroup.length) {
      fieldStructure.push(fieldGroup);
    }

    return fieldStructure;
  }

  public getDisabled(editAllowedList: string[], field: GenericFieldInfo): boolean {
    return (field.readonly || (editAllowedList && !editAllowedList.includes(field.name)));
  }

  public isSelected(data: any, field: GenericFieldInfo, item: any): boolean {
    if (!field.lookup || !field.lookup.metaInfoSelector) {
      return false;
    }
    const ids: number[] = this.getFieldValue(data, field) as number[] | [];
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (!metaInfo || !metaInfo.fields) {
      return false;
    }
    const keyLookupFieldName: string = metaInfo.fields.find(lookupField => lookupField.isPrimaryKey).name;
    if (!ids || !keyLookupFieldName) {
      return false;
    }

    return (ids.findIndex((selected: number) => item[keyLookupFieldName] === selected) > -1);
  }

  public isSelectedObject(data: any, field: GenericFieldInfo, item: any): boolean {
    if (!field.lookup || !field.lookup.metaInfoSelector) {
      return false;
    }
    const selectedIds: number[] = this.getFieldValue(data, field) as number[] | [];
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (!metaInfo || !metaInfo.fields) {
      return false;
    }
    const keyLookupFieldName: string = metaInfo.fields.find(lookupField => lookupField.isPrimaryKey).name;
    if (!selectedIds || !keyLookupFieldName) {
      return false;
    }

    return !!selectedIds.find(selected => item[keyLookupFieldName] === selected[keyLookupFieldName]);
    // const ids = selectedIds.map(id => id[keyLookupFieldName]);
    // console.log(`is selected: ${result} data: ${ids.join()} selected item: ${item[keyLookupFieldName]}`);
  }

  public getFieldValue(data: any, field: GenericFieldInfo): number | string | number[] {
    if (!data) {
      return '';
    }
    const value = data[field.name];
    if (value === null || value === undefined || (field.type === ControlType.number && isNaN(value))) {
      return '';
    }

    let numberValue: number;
    if (field.type === ControlType.number) {
      if (typeof value === 'string') {
        numberValue = Number(value);
      } else {
        numberValue = value;
      }
      return this.numberFormatter(numberValue);
    } else {
      return value;
    }
  }

  public showFormField(field: GenericFieldInfo): boolean {
    return (field &&
      (!field.isPrimaryKey ||
        field.type === ControlType.select ||
        field.type === ControlType.selectAutocomplete));
  }

  public getLookupValueById(field: GenericFieldInfo, value: any): string {
    let result: string = null;
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
      const cacheTable = this.cacheService.getCachedTable(field.lookup.metaInfoSelector);
      if (cacheTable && field.lookup.metaInfoSelector) {
        if (metaInfo && metaInfo.fields) {
          const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
          if (primaryKeyName) {
            const primaryKey = cacheTable.find(item => item[primaryKeyName] === value);
            if (primaryKey) {
              result = field.lookup.getLookupValue(primaryKey);
            }
          }
        }
      }
    } else {
      console.error(`Crud: Cache support required for '${field.lookup.metaInfoSelector}'\nto show the selected value in table`);
    }

    return result;
  }

  public getLookupObjectArray(field: GenericFieldInfo, parentData: any, lookupArray: any[]): any[] {
    const resultData: any = [];
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      lookupArray.forEach(assocoationItem => {
        const associationResult = {};
        metaInfo.fields.forEach(lookupField => {
          let mapping = '';
          switch (lookupField.type) {
            case ControlType.referenceByParentData:
              mapping = parentData[lookupField.name];
              break;

            default:
              mapping = assocoationItem[lookupField.name];
              break;
          }
          associationResult[lookupField.name] = mapping;
        });
        resultData.push(associationResult);
      });
    }

    return resultData;
  }

  public getLookupKeyArray(field: GenericFieldInfo, fieldValue: any): any[] {
    let resultData: any = [];
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      const keyLookupField: any = metaInfo.fields.find(lookupField => lookupField.isPrimaryKey);
      if (keyLookupField && keyLookupField.name) {
        resultData = fieldValue.map((item: any) => item[keyLookupField.name]);
      }
    }

    return resultData;
  }

  public getLookupKey(field: GenericFieldInfo, fieldValue: any): number {
    const metaInfo = this.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(metaInfo.fields);
      return fieldValue[primaryKeyName];
    } else {
      return null;
    }
  }

  // public getFilteredListData(filterField: GenericControlInfo, value: any[]): any[] {
  //   const filterValue = this.metaInfoExtraDataService.getExtraData(filterField.name);
  //   return value ? value.filter((item: any) => !filterValue || item[filterField.name] === filterValue) : [];
  // }

  public getTableData(control: GenericFieldInfo, data: any): BehaviorSubject<any[]> {
    return new BehaviorSubject<any[]>(data[control.name] || null);
  }

  public getMetaInfoInstance(metaInfoSelector: MetaInfoTag): MetaInfo {
    return this.metaInfoDefinitions.get(metaInfoSelector);
  }

  public getFormDialogWidth(metaInfo: MetaInfo): string {
    return metaInfo && metaInfo.formWidth ? metaInfo.formWidth : '500px';
  }

  public prepareFieldStructure(metaInfoSelector: string): GenericFieldInfo[][][] {
    const metaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
    const updateFields = this.getUpdateFields(metaInfo.fields);
    const fieldStructure = this.getFieldStructure(updateFields);
    return fieldStructure;
  }

  public hasTabs(metaInfo: MetaInfo): boolean {
    return metaInfo.tabPages && metaInfo.tabPages.length > 0;
  }

  public isLookupField(field: GenericFieldInfo) {
    return field.type === ControlType.selectAutocomplete ||
      field.type === ControlType.checkList ||
      field.type === ControlType.checkListObject ||
      field.type === ControlType.select ||
      field.type === ControlType.selectMulti ||
      field.type === ControlType.selectMultiObject ||
      field.type === ControlType.table ||
      field.type === ControlType.tableMasterDetail;
  }

  public isEqualModel(metaInfo: MetaInfo, obj1: any, obj2: any) {
    const arr1 = this.flattenObject(metaInfo, obj1);
    const arr2 = this.flattenObject(metaInfo, obj2);
    return isEqual(arr1, arr2);
  }

  private flattenObject(metaInfo: MetaInfo, modelData: any): any[] {
    const flattenModel = [];
    const fields = metaInfo.fields;
    Object.entries(modelData).forEach((item) => {
      if (Array.isArray(item[1])) {
        const lookupField = fields.find((fieldItem) => item[0] === fieldItem.name);
        const childMetaInfo = this.getMetaInfoInstance(lookupField?.lookup?.metaInfoSelector);
        if (childMetaInfo) {
          const lookupPrimaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(childMetaInfo.fields);
          const subArr: any[] = item[1].sort((item1, item2) => item1[lookupPrimaryKeyName] - item2[lookupPrimaryKeyName]);

          subArr.sort().forEach((subItem) => {
            const obj = {};
            const key = `${item[0]}_${lookupPrimaryKeyName}`;
            obj[key] = subItem;
            flattenModel.push(obj);
          });
        }
      } else {
        flattenModel.push(item);
      }
    });
    return flattenModel;
  }
}
