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
  selectMultiObject = 'select-multi-object',
  selectMultiObjectJoin = 'select-multi-object-join',
  selectAutocomplete = 'select-autocomplete',
  checkList = 'checkList',
  checkListObject = 'check-list-object',
  checkListObjectJoin = 'check-list-object-join',
  table = 'table',
  tableJoin = 'table-join',
  tableMasterDetail = 'table-master-detail',
  referenceByParentData = 'reference-by-parent-data',
  placeHolder = 'place-holder'
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
  parentKeyName?: string;
  type: ControlType;
  label?: string;
  isTableColumn?: boolean;
  isFormControl?: boolean;
  isPrimaryKey?: boolean;
  isFilterControl?: boolean;
  isPreSortedItem?: boolean;
  error?: string;
  required?: boolean;
  validator?: ValidatorFn | ValidatorFn[];
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  formatOption?: GenericControlFormatOption;
  lookup?: Lookup;
}

export class Lookup {
  metaInfoSelector?: MetaInfoTag;
  joinMetaInfoSelector?: MetaInfoTag;
  lookupKeyName?: string;
  getLookupValue?: (item: any, joinTables: any[][]) => string;
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
  isDeletable?: boolean;
  formWidth?: string;
  tabPages?: TabPageInfo[];
}
