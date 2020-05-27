import { GenericFieldInfo, MetaInfoTag } from '../meta-info/meta-info.model';

export class CrudTableResult {
  data: any[];
  field: GenericFieldInfo;
}

export class CrudFormParameter {
  data: any;
  metaInfoSelector: string | MetaInfoTag;
  editAllowedList?: string[];
  hideList?: string[];
  isFormLevel?: boolean;
  parentData?: any;
  parentMetaInfoselector?: MetaInfoTag;
}

export class WebSocketCacheData {
  data: any;
  action: CrudAction;
}

export enum CrudAction {
  Update = 'Update',
  Insert = 'Insert',
  Delete = 'Delete'
}
