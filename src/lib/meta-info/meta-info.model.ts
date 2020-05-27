import { ValidatorFn } from '@angular/forms';

export enum _MetaInfoTag {
  Undefined = '',
}

export type MetaInfoTag = _MetaInfoTag | string;

export enum ControlType {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  select = 'select',
  selectMulti = 'select-multi',
  selectMultiObject = 'select-multi-object', // not yet supported!!
  selectAutocomplete = 'selectAutocomplete',
  checkList = 'checkList',
  checkListObject = 'checkListObject',
  table = 'table',
  tableMasterDetail = 'tableMasterDetail',
  referenceByExtraData = 'referenceByExtraData',
  referenceByParentData = 'referenceByParentData',
  placeHolder = 'placeHolder'
}

export class GenericControlFormatOption {
  beginFieldRow?: boolean;
  beginFieldGroup?: boolean;
  groupName?: string;
  tabName?: string;
  tableFlexParameter?: string;
  formFlexParameter?: string;
}

export class GenericFieldInfo {
  name: string;
  type: ControlType;
  label?: string;
  isTableColumn?: boolean;
  isFormControl?: boolean;
  isPrimaryKey?: boolean;
  isFilterControl?: boolean;
  isPreSortedItem?: boolean;
  error?: string;
  required?: boolean;
  validator?: ValidatorFn;
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  formatOption?: GenericControlFormatOption;
  lookup?: Lookup;
}

export class ListFilter {
  id: number;
  name: string;
}

export class Lookup {
  metaInfoSelector?: MetaInfoTag;
  getLookupValue?: (item: any) => string;
  filter?: ListFilter;
}

export class FilterMetaInfo {
  title?: string;
  field: GenericFieldInfo;
}

export enum CacheSupportLevel {
  None = 1,
  Basic = 2,
  Complete = 3
}

export class TabPageInfo {
  metaInfoSelector: MetaInfoTag;
  title: string;
}

export class MetaInfo {
  cacheSupportLevel?: CacheSupportLevel;
  connectedCacheTables?: MetaInfoTag[];
  restPath?: string;
  title?: string;
  fields?: GenericFieldInfo[];
  fieldFilterInfo?: MetaInfo;
  isDeletable?: boolean;
  formWidth?: string;
  tabPages?: TabPageInfo[];
}
