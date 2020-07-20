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
  parentData?: any;
  parentMetaInfoSelector?: MetaInfoTag;
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

export enum ScrollMode {
  Table,
  Content,
  Page
}
