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
    if (this.metaInfoService.showFormField(field)) {
      const value: string | number | number[] = this.metaInfoService.getFieldValue(this.parameter.data, field);
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

  private setupControl(field: GenericFieldInfo, data: any, value: any, control: FormControl) {
    const metaInfoSelector = field && field.lookup && field.lookup.metaInfoSelector as MetaInfoTag;
    const tableData$: BehaviorSubject<any[]> = this.getLookupData(field, data, value);
    this.setupLookupControls(metaInfoSelector, tableData$, field, value, control);
  }

  public updateControl(data: any) {
    const field = this.field;
    const value: string | number | number[] = this.metaInfoService.getFieldValue(this.parameter.data, field);
    const metaInfoSelector = field.lookup && field.lookup.metaInfoSelector as MetaInfoTag;
    const control = this.getFormControl(field);
    if (this.metaInfoService.isLookupField(field)) {
      const tableData$: BehaviorSubject<any[]> = this.getLookupData(field, data, value);
      this.setupLookupControls(metaInfoSelector, tableData$, field, value, control);
    } else {
      control.setValue(value);
    }
  }

  public getTableData(field: GenericFieldInfo): BehaviorSubject<any[]> {
    const metaInfoSelector = field && field.lookup && field.lookup.metaInfoSelector || '';
    return this.lookupListDataMap.get(metaInfoSelector);
  }

  public displayLookupLine(item: any[]): string {
    const field = this.field;
    if (!field?.lookup?.getLookupValue) {
      return null;
    } else {
      let displayLine: string;
      if (!field.required) {
        const metaInfoSelector = field.lookup.metaInfoSelector as MetaInfoTag;
        const childMetaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
        if (childMetaInfo) {
          const primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(childMetaInfo.fields);
          if (!item[primaryKeyName]) {
            displayLine = MetaInfoService.defaultSelectDisplayLine;
          }
        }
      }
      return displayLine ? displayLine : field.lookup.getLookupValue(item);
    }
  }

  public onRefreshTableData(crudTableResult: CrudTableResult) {
    this.parameter.data[crudTableResult.field.name] = crudTableResult.data;
    this.refreshTableData.next(crudTableResult);
  }

  public isSelected(item: any): boolean {
    return this.metaInfoService.isSelected(this.parameter.data, this.field, item);
  }

  public isSelectedObject(item: any): boolean {
    return this.metaInfoService.isSelectedObject(this.parameter.data, this.field, item);
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

  private getLookupData(field: GenericFieldInfo, data: any[], value: string | number | number[]) {
    let tableData$: BehaviorSubject<any[]>;
    switch (field.type) {
      case ControlType.select:
        tableData$ = this.metaInfoService.getSelectData(field, data, value);
        break;
      case ControlType.selectMulti:
      case ControlType.selectMultiObject:
        tableData$ = this.metaInfoService.getCheckListData(field, data);
        break;
      case ControlType.checkList:
      case ControlType.checkListObject:
        tableData$ = this.metaInfoService.getCheckListData(field, data);
        break;
      case ControlType.table:
        tableData$ = this.metaInfoService.getTableData(field, data);
        break;
      case ControlType.tableMasterDetail:
        const metaInfoSelector = field.lookup && field.lookup.metaInfoSelector;
        tableData$ = this.metaInfoService.getJoinedTableData(this.parameter.metaInfoSelector, metaInfoSelector, data);
        break;
    }
    return tableData$;
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
            this.metaInfoService.setLookupArrayId(field, listData, value as any[], control);
          });
          break;

        case ControlType.selectMultiObject:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.metaInfoService.setLookupArrayValue(field, listData, value as any[], control);
          });
          break;

        case ControlType.select:
        case ControlType.checkList:
        case ControlType.tableMasterDetail:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.metaInfoService.setLookupValue(field, listData, value, control);
          });
          break;

        case ControlType.checkListObject:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.metaInfoService.setLookupArrayValue(field, listData, value as any[], control);
          });
          break;

        case ControlType.table:
          tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
            this.metaInfoService.setLookupObjectValue(field, listData, control);
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
