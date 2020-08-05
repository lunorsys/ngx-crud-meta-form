import { Injectable, OnDestroy, Inject, Injector } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Globalize from 'globalize/dist/globalize';
import { cloneDeep, isEqual } from 'lodash';
//
import { CrudService } from './crud.service';
import { MetaInfo, GenericFieldInfo, ControlType, MetaInfoTag, CacheSupportLevel } from '../meta-info/meta-info.model';
import { CrudConfig } from '../models/crud-config';
import { CACHE_TOKEN, ICacheService } from '../interfaces/icache.service';
import { MetaInfoService } from './meta-info.service';

@Injectable({
  providedIn: 'root'
})
export class CrudObjectsService implements OnDestroy {

  constructor(
    private crudService: CrudService,
    private metaInfoService: MetaInfoService,
    private crudConfig: CrudConfig,
    @Inject(CACHE_TOKEN) private cacheService: ICacheService,
    private injector: Injector
  ) {
    this.metaInfoDefinitions = this.crudConfig.metaInfoDefinitions;
    this.numberFormatter = Globalize.numberFormatter();
  }

  // static injector: Injector;
  public static defaultSelectDisplayLine = '-- please select --';

  private ngUnsubscribe = new Subject();
  private numberFormatter: (value: number) => string;
  private metaInfoDefinitions: Map<MetaInfoTag, MetaInfo>;

  // public static getLookupData(metaInfoSelector: MetaInfoTag, lookupId: number): any {
  //   const crudService = CrudObjectsService.injector.get(CrudService);
  //   return crudService.getValue(metaInfoSelector, lookupId);
  // }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public getSelectData(field: GenericFieldInfo, parentData: any, value: any): BehaviorSubject<any[]> {
    const listData$ = new BehaviorSubject<any[]>([]);

    if (!field.lookup) {
      return listData$;
    }

    const metaInfoSelector = field?.lookup?.metaInfoSelector;
    const defaultEntry = this.prepareDefaultEntry(field, metaInfoSelector, value);
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo) {
      if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
        const listData = cloneDeep(this.cacheService.getCachedTable(metaInfoSelector));
        if (defaultEntry) {
          listData.unshift(defaultEntry);
        }
        listData$.next(listData);
      } else {

        const parentPrimaryKeyValue = this.getPrimaryKeyValue(metaInfoSelector, parentData);
        const restPath = this.metaInfoService.extractRestPath(metaInfo, parentPrimaryKeyValue);
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

  public getChecklistData(field: GenericFieldInfo, parentData: any): BehaviorSubject<any[]> {
    const listData$ = new BehaviorSubject<any[]>([]);

    if (!field.lookup) {
      return listData$;
    }

    const metaInfoSelector = field?.lookup?.metaInfoSelector;
    const metaInfo = metaInfoSelector && this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo) {
      if (metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
        const listData = this.cacheService.getCachedTable(metaInfoSelector);
        listData$.next(listData);
      } else {
        const parentPrimaryKeyValue = this.getPrimaryKeyValue(metaInfoSelector, parentData);
        const restPath = this.metaInfoService.extractRestPath(metaInfo, parentPrimaryKeyValue);
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
      const childMetaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
      if (!childMetaInfo) {
        console.error(`Crud: No metaInfo found for '${metaInfoSelector}'`);
      } else {
        const primaryKeyName = this.metaInfoService.getPrimaryKeyName(childMetaInfo.fields);
        if (!value[primaryKeyName]) {
          defaultEntry = {};
          defaultEntry[primaryKeyName] = null;
        }
      }
    }
    return defaultEntry;
  }

  public getJoinedTableData(parentMetaInfoSelector: MetaInfoTag, metaInfoSelector: MetaInfoTag, parentData: any): BehaviorSubject<any[]> {
    const listData$ = new BehaviorSubject<any[]>([]);

    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    const parentMetaInfo = this.metaInfoDefinitions.get(parentMetaInfoSelector);

    const parentPrimaryKeyName = this.metaInfoService.getPrimaryKeyName(parentMetaInfo.fields);
    if (parentPrimaryKeyName) {
      const parentPrimaryKeyValue = this.getPrimaryKeyValue(metaInfoSelector, parentData);
      if (parentPrimaryKeyValue) {
        if (parentMetaInfo && metaInfo.cacheSupportLevel && metaInfo.cacheSupportLevel !== CacheSupportLevel.None) {
          const listData = this.cacheService.getTableMasterDetail(metaInfoSelector, parentPrimaryKeyName, parentPrimaryKeyValue);
          listData$.next(listData);
        } else {
          if (parentPrimaryKeyValue) {
            const restPath = this.metaInfoService.extractRestPath(metaInfo, parentPrimaryKeyValue);
            const listDataResult$ = this.crudService.getTable(metaInfoSelector, restPath);
            listDataResult$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData: any[]) => {
              listData$.next(listData);
            });
          }
        }
      } else {
        listData$.next([]);
      }
    } else {
      listData$.next([]);
      console.error(`Crud: Missing parent primary key defintion for join table '${metaInfoSelector}'`);
    }
    return listData$;
  }

  public setLookupValue(field: GenericFieldInfo, listData: any[], value: any, control: FormControl): void {

    const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo?.fields) {
      const primaryKeyName = this.metaInfoService.getPrimaryKeyName(metaInfo.fields);
      if (primaryKeyName) {
        const selectedItem = listData?.find((item: any) => {
          return item[primaryKeyName] === value;
        });
        control.setValue(selectedItem);
      }
    }
  }

  public setLookupObjectValue(field: GenericFieldInfo, listData: any[], control: FormControl): void {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      control.setValue(listData);
    }
  }

  public setLookupArrayValue(field: GenericFieldInfo, listData: any[], value: any[], control: FormControl): void {
    if (value && listData) {
      const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
      const primaryKeyField = metaInfo?.fields.find(fieldItem => fieldItem.isPrimaryKey);
      const primaryKeyName = primaryKeyField?.lookup?.lookupKeyName ?? primaryKeyField.name;
      if (primaryKeyName) {
        const selectedItems: any[] = listData?.filter((item: any) =>
          value.some(subItem => item[primaryKeyName] === subItem[primaryKeyField.name])) ?? [];
        control.setValue(selectedItems);
      }
    }
  }

  public setLookupJoinArrayValue(field: GenericFieldInfo, listData: any[], value: any[], control: FormControl): void {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields && value) {
      const primaryKeyName = this.metaInfoService.getPrimaryKeyName(metaInfo.fields);
      if (primaryKeyName) {
        const selectedItems: any[] = listData ? listData.filter((item: any) =>
          value.some(subItem => item[primaryKeyName] === subItem[primaryKeyName])) : [];
        control.setValue(selectedItems);
      }
    }
  }

  public setLookupArrayId(field: GenericFieldInfo, listData: any[], value: any[], control: FormControl): void {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields && value) {
      const primaryKeyName = this.metaInfoService.getPrimaryKeyName(metaInfo.fields);
      if (primaryKeyName) {
        const selectedItems: any[] = listData ? listData.filter((item: any) =>
          value.some(id => item[primaryKeyName] === id)) : [];
        control.setValue(selectedItems);
      }
    }
  }

  public isSelected(data: any, field: GenericFieldInfo, item: any): boolean {
    if (!field.lookup || !field.lookup.metaInfoSelector) {
      return false;
    }
    const ids: number[] = this.getFieldValue(data, field) as number[] | [];
    const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
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
    const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (!metaInfo || !metaInfo.fields) {
      return false;
    }
    const keyLookupFieldName: string = metaInfo.fields.find(lookupField => lookupField.isPrimaryKey).name;
    if (!selectedIds || !keyLookupFieldName) {
      return false;
    }

    return !!selectedIds.find(selected => item[keyLookupFieldName] === selected[keyLookupFieldName]);
    // for test:
    // const ids = selectedIds.map(id => id[keyLookupFieldName]);
    // console.log(`is selected: ${result} data: ${ids.join()} selected item: ${item[keyLookupFieldName]}`);
  }

  public getFieldValue(data: any, field: GenericFieldInfo): number | string | number[] | any {
    if (!data) {
      return null;
    }
    const value = data[field.name];
    if (value === null || value === undefined || (field.type === ControlType.Number && isNaN(value))) {
      return '';
    }

    let numberValue: number;
    if (field.type === ControlType.Number) {
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

  public getLookupValueById(field: GenericFieldInfo, id: any): string {
    let result: string = null;
    const metaInfoSelector = field?.lookup?.metaInfoSelector;
    const metaInfo = metaInfoSelector && this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo?.cacheSupportLevel && metaInfo?.cacheSupportLevel !== CacheSupportLevel.None) {
      const cacheTable = this.cacheService.getCachedTable(metaInfoSelector);
      if (cacheTable && metaInfo.fields) {
        const primaryKeyName = this.metaInfoService.getPrimaryKeyName(metaInfo.fields);
        if (primaryKeyName) {
          // const lookupTables = [];
          // const joinMetaInfoSelector: any[] = field?.lookup?.joinMetaInfoSelector;
          // joinMetaInfoSelector.forEach((joinSelector) => {
          //   lookupTables.push(this.getMetaInfoInstance(joinSelector));
          // });
          const lookupItem = cacheTable.find(item => item[primaryKeyName] === id);
          result = lookupItem && field.lookup.getLookupValue(lookupItem, []);
        }
      }
    } else {
      console.error(`Crud: Cache support required for '${field.lookup.metaInfoSelector}'\nto show the selected value in table`);
    }

    return result;
  }

  public getLookupObjectArray(lookupField: GenericFieldInfo, data: any, controlList: any[]): any[] {
    const resultData: any = [];
    const metaInfo = this.metaInfoService.getMetaInfoInstance(lookupField.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      controlList?.forEach(assocoationItem => {
        const associationResult = {};
        metaInfo.fields.forEach(field => {
          let mapping = '';
          const parentFieldName = field.parentKeyName ?? field.name;
          switch (field.type) {
            case ControlType.ReferenceByParentData:
            case ControlType.SelectMultiObjectJoin:
              mapping = data[parentFieldName];
              break;

            case ControlType.Select:
              mapping = assocoationItem[field?.lookup?.lookupKeyName ?? field.name];
              break;

            default:
              if (lookupField.type === ControlType.SelectMultiObject) {
                if (field.isPrimaryKey) {
                  mapping = data[lookupField.name]?.find((lookupFieldItem: any) => lookupFieldItem[field.name])?.[field.name];
                } else {
                  mapping = assocoationItem[field.name];
                }
              } else {
                mapping = assocoationItem[field.name];
              }
              break;
          }
          associationResult[field.name] = mapping;
        });
        resultData.push(associationResult);
      });
    }

    return resultData;
  }

  public getLookupKeyArray(field: GenericFieldInfo, fieldValue: any): any[] {
    let resultData: any = [];
    const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      const keyLookupField: any = metaInfo.fields.find(lookupField => lookupField.isPrimaryKey);
      if (keyLookupField && keyLookupField.name) {
        resultData = fieldValue && fieldValue.map((item: any) => item[keyLookupField.name]);
      }
    }

    return resultData;
  }

  public getLookupKey(field: GenericFieldInfo, fieldValue: any): number {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(field.lookup.metaInfoSelector);
    if (metaInfo && metaInfo.fields) {
      const primaryKeyName = this.metaInfoService.getPrimaryKeyName(metaInfo.fields);
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
        const childMetaInfo = this.metaInfoService.getMetaInfoInstance(lookupField?.lookup?.metaInfoSelector);
        if (childMetaInfo) {
          const lookupPrimaryKeyName = this.metaInfoService.getPrimaryKeyName(childMetaInfo.fields);
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

  public getPrimaryKeyValue(metaInfoSelector: MetaInfoTag, srcData: any): any {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    const primaryKeyName = metaInfo?.fields?.find(field => field.isPrimaryKey)?.name;
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found`);
      return null;
    } else {
      return srcData?.[primaryKeyName];
    }
  }

  public setPrimaryKeyValue(metaInfoSelector: MetaInfoTag, srcData: any, dstData: any): void {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    const primaryKeyName = metaInfo?.fields?.find(field => field.isPrimaryKey)?.name;
    if (!primaryKeyName) {
      console.error(`Crud: No primaryKeyName found`);
    } else if (srcData[primaryKeyName]) {
      dstData[primaryKeyName] = srcData[primaryKeyName];
    }
  }
}
