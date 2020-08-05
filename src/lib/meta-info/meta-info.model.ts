import { ValidatorFn } from '@angular/forms';

export enum _MetaInfoTag {
  Undefined = '',
}

export type MetaInfoTag = _MetaInfoTag | string;

export enum ControlType {
  Boolean = 'boolean',
  CheckList = 'checkList',
  CheckListObject = 'check-list-object',
  CheckListObjectJoin = 'check-list-object-join',
  Date = 'date', // not yet supported
  Datetime = 'datetime',
  Number = 'number',
  PlaceHolder = 'place-holder',
  ReferenceByParentData = 'reference-by-parent-data',
  Select = 'select',
  SelectAutocomplete = 'select-autocomplete',  // not yet supported
  SelectMulti = 'select-multi',
  SelectMultiObject = 'select-multi-object',
  SelectMultiObjectJoin = 'select-multi-object-join',
  String = 'string',
  Table = 'table',
  TableJoin = 'table-join',
  TableMasterDetail = 'table-master-detail'
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
