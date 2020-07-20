import { Component, OnInit, Inject, Input, OnDestroy, ViewChild, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Subject } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { MatSelectionList } from '@angular/material/list';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
//
import { MetaInfoTag, GenericFieldInfo, ControlType } from '../../meta-info/meta-info.model';
import { CrudTableResult, CrudFormParameter } from '../../models/crud.model';
import { MetaInfoBaseService } from '../../services/meta-info-base.service';
import { CrudObjectsService } from '../../services/crud-objects.service';
import { MetaInfoService } from '../../services/meta-info.service';

@Component({
  selector: 'ngx-crud-fields',
  templateUrl: './crud-fields.component.html',
  styleUrls: ['./crud-fields.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldsComponent implements OnInit, OnDestroy {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() parentForm: FormGroup;
  @Output() refreshTableData = new EventEmitter<CrudTableResult>();
  @ViewChild(MatSelectionList) selectionList: MatSelectionList;
  @ViewChild(MatSelect) select: MatSelect;

  public lookupListDataMap = new Map<MetaInfoTag, BehaviorSubject<any[]>>();
  private ngUnsubscribe = new Subject();

  ControlType = ControlType;

  constructor(@Inject(MAT_DIALOG_DATA) public parameter: CrudFormParameter,
    private metaInfoBaseService: MetaInfoBaseService,
    private crudObjectsService: CrudObjectsService,
    private metaInfoService: MetaInfoService) { }

  ngOnInit(): void {
    this.makeControl();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private makeControl() {
    const field = this.field;
    if (this.metaInfoService.isFormFieldVisible(field)) {
      const value: string | number | number[] = this.crudObjectsService.getFieldValue(this.parameter.data, field);
      let control: FormControl;
      if (field.validator) {
        control = new FormControl(value, field.validator);
      } else {
        control = new FormControl(value);
      }
      this.parentForm.addControl(field.name, control);
      this.setupControl(field, this.parameter.data, value, control);

      if (this.metaInfoService.getDisabled(this.parameter.editAllowedList, field)) {
        control.disable();
      }
    }
  }

  private setupControl(field: GenericFieldInfo, data: any, value: any | any[], control: FormControl) {
    const metaInfoSelector = field?.lookup?.metaInfoSelector as MetaInfoTag;
    let tableData$: BehaviorSubject<any[]>;
    this.lookupListDataMap.set(metaInfoSelector, tableData$);
    switch (field.type) {
      case ControlType.select:
        tableData$ = this.crudObjectsService.getSelectData(field, data, value);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupValue(field, listData, value || null, control);
        });
        break;

      case ControlType.selectMulti:
        tableData$ = this.crudObjectsService.getCheckListData(field, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupArrayId(field, listData, value, control);
        });
        break;

      case ControlType.selectMultiObject:
        tableData$ = this.crudObjectsService.getCheckListData(field, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupArrayValue(field, listData, value, control);
        });
        break;

      case ControlType.selectMultiObjectJoin:
        tableData$ = this.crudObjectsService.getCheckListData(field, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupJoinArrayValue(field, listData, value, control);
        });
        break;

      case ControlType.checkList:
        tableData$ = this.crudObjectsService.getCheckListData(field, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupValue(field, listData, value, control);
        });
        break;

      case ControlType.checkListObject:
        tableData$ = this.crudObjectsService.getCheckListData(field, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupArrayValue(field, listData, value, control);
        });
        break;

      case ControlType.checkListObjectJoin:
        tableData$ = this.crudObjectsService.getCheckListData(field, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupArrayValue(field, listData, value, control);
        });
        break;

      case ControlType.table:
        tableData$ = this.crudObjectsService.getTableData(field, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupObjectValue(field, listData, control);
        });
        break;

      case ControlType.tableJoin:
        tableData$ = this.crudObjectsService.getTableData(field, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupObjectValue(field, listData, control);
        });
        break;

      case ControlType.tableMasterDetail:
        tableData$ = this.crudObjectsService.getJoinedTableData(this.parameter?.metaInfoSelector, metaInfoSelector, data);
        tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
          this.crudObjectsService.setLookupValue(field, listData, value, control);
        });
        break;

      default:
        control.setValue(value);
        break;
    }
    this.setupLookupControls(metaInfoSelector, tableData$, field, value, control);
  }

  public updateControl(data: any) {
    const field = this.field;
    const value: string | number | number[] = this.crudObjectsService.getFieldValue(this.parameter.data, field);
    const control = this.getFormControl(field);
    this.setupControl(field, data, value, control);
  }

  public getTableData(field: GenericFieldInfo): BehaviorSubject<any[]> {
    const metaInfoSelector = field?.lookup?.metaInfoSelector || '';
    return this.lookupListDataMap.get(metaInfoSelector);
  }

  public displayLookupLine(item: any[]): string {
    const field = this.field;
    if (!field?.lookup?.getLookupValue) {
      return null;
    } else {
      // let displayLine: string;
      // if (!field.required) {
      const metaInfoSelector = field.lookup.metaInfoSelector as MetaInfoTag;
      const childMetaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
      if (childMetaInfo) {
        // const lookupKeyField = childMetaInfo.fields.find(lookupField => lookupField?.type === ControlType.selectMultiObject);
        // if (lookupKeyField) {
        //   // const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(childMetaInfo.fields);
        //   if (!item[lookupKeyField?.name] && field.required) {
        //     displayLine = MetaInfoService.defaultSelectDisplayLine;
        //   }
        //   // }
        // } else {

        // }
        // return displayLine ? displayLine : field.lookup.getLookupValue(item, []);
      }
      return field.lookup.getLookupValue(item, [])
    }
  }

  public onRefreshTableData(crudTableResult: CrudTableResult) {
    this.parameter.data[crudTableResult.field.name] = crudTableResult.data;
    this.refreshTableData.next(crudTableResult);
  }

  public isSelected(item: any): boolean {
    return this.crudObjectsService.isSelected(this.parameter.data, this.field, item);
  }

  public isSelectedObject(item: any): boolean {
    return this.crudObjectsService.isSelectedObject(this.parameter.data, this.field, item);
  }

  public getSelectedOptions(): any[] {
    if (this.field.lookup) {
      return [];
    } else {
      const childMetaInfo = this.metaInfoBaseService.getMetaInfoInstance(this.field.lookup.metaInfoSelector);
      const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(childMetaInfo.fields);
      return this.parameter.data[primaryKeyName];
    }
  }

  public getFormControl(field): FormControl {
    return this.parentForm.get(field.name) as FormControl;
  }

  private setupLookupControls(metaInfoSelector: string, tableData$: BehaviorSubject<any[]>, field: GenericFieldInfo,
    value: string | number | number[] | any[], control: FormControl) {
    if (metaInfoSelector && tableData$) {
      if (field.type === ControlType.select) {
        value = value || null;
      }

      this.lookupListDataMap.set(metaInfoSelector, tableData$);
      switch (field.type) {
        case ControlType.selectMulti:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.crudObjectsService.setLookupArrayId(field, listData, value as any[], control);
          });
          break;

        case ControlType.selectMultiObject:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.crudObjectsService.setLookupArrayValue(field, listData, value as any[], control);
          });
          break;

        case ControlType.selectMultiObjectJoin:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.crudObjectsService.setLookupJoinArrayValue(field, listData, value as any[], control);
          });
          break;

        case ControlType.select:
        case ControlType.checkList:
        case ControlType.tableMasterDetail:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.crudObjectsService.setLookupValue(field, listData, value, control);
          });
          break;

        case ControlType.checkListObject:
        case ControlType.checkListObjectJoin:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.crudObjectsService.setLookupArrayValue(field, listData, value as any[], control);
          });
          break;

        case ControlType.table:
        case ControlType.tableJoin:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.crudObjectsService.setLookupObjectValue(field, listData, control);
          });
          break;
      }
    }
    return value;
  }

  public getSelectionList(): any[] {
    return this.selectionList.selectedOptions.selected.map((selectedItem) => {
      return selectedItem.value;
    });
  }

  public getSelect(): MatOption | MatOption[] {
    return this.select.selected;
  }
}
