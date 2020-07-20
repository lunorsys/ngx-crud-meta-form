import {
  Component, OnInit, Inject, Input, OnDestroy, ViewChild, Output, EventEmitter, ChangeDetectionStrategy,
  ViewChildren, ChangeDetectorRef, QueryList
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatSelectionList } from '@angular/material/list';
import { MatSelect } from '@angular/material/select';
//
import { MetaInfoTag, GenericFieldInfo, ControlType } from '../../meta-info/meta-info.model';
import { CrudTableResult, CrudFormParameter } from '../../models/crud.model';
import { CrudFieldBaseComponent } from './crud-field-base';

@Component({
  selector: 'ngx-crud-fields',
  templateUrl: './crud-fields.component.html',
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldsComponent implements OnInit, OnDestroy {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() parentForm: FormGroup;
  @Output() refreshTableData = new EventEmitter<CrudTableResult>();
  @ViewChild(MatSelectionList) selectionList: MatSelectionList;
  @ViewChild(MatSelect) select: MatSelect;

  @ViewChildren(
    'stringComponent, checkboxComponent, numberComponent, selectComponent, selectMultiObjectComponent, ' +
    'selectMultiComponent, checklistComponent, checklistObjectComponent, tableMasterDetailComponent')
  fieldComponent: QueryList<CrudFieldBaseComponent>;

  private ngUnsubscribe = new Subject();
  public control: FormControl;
  public fieldForm: FormGroup;

  ControlType = ControlType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogParameter: CrudFormParameter,
    private fb: FormBuilder,
    private changeDetection: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fieldForm = this.fb.group({});
    this.parentForm.addControl(this.field.name + '_fieldForm', this.fieldForm);
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  public getControlValue() {
    return this.fieldComponent?.first?.getControlValue();
  }

  // public updateControl(data: any) {
  //   const field = this.field;
  //   const value = this.crudObjectsService.getFieldValue(this.dialogParameter.data, field);
  //   const control = this.parentForm.get(field.name) as FormControl;
  //   this.setupControl(field, data, value, control);
  // }

  // private setupControl(field: GenericFieldInfo, data: any, value: any | any[], control: FormControl) {
  //   const metaInfoSelector = field?.lookup?.metaInfoSelector as MetaInfoTag;
  //   let tableData$: BehaviorSubject<any[]>;
  //   switch (field.type) {
  //     case ControlType.selectMultiObjectJoin:
  //       tableData$ = this.crudObjectsService.getChecklistData(field, data);
  //       tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
  //         this.crudObjectsService.setLookupJoinArrayValue(field, listData, value, control);
  //       });
  //       break;

  //     case ControlType.checkListObjectJoin:
  //       tableData$ = this.crudObjectsService.getChecklistData(field, data);
  //       tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
  //         this.crudObjectsService.setLookupArrayValue(field, listData, value, control);
  //       });
  //       break;

  //     case ControlType.table:
  //       tableData$ = this.crudObjectsService.getTableData(field, data);
  //       tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
  //         this.crudObjectsService.setLookupObjectValue(field, listData, control);
  //       });
  //       break;

  //     case ControlType.tableJoin:
  //       tableData$ = this.crudObjectsService.getTableData(field, data);
  //       tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
  //         this.crudObjectsService.setLookupObjectValue(field, listData, control);
  //       });
  //       break;

  //     default:
  //       // console.error(`no setup control found for '${field.type}'`)
  //       break;
  //   }
  //   this.setupLookupControls(metaInfoSelector, tableData$, field, value, control);
  // }

  // public getFormControl(field): FormControl {
  //   return this.parentForm.get(field.name) as FormControl;
  // }

  // private setupLookupControls(metaInfoSelector: string, tableData$: BehaviorSubject<any[]>, field: GenericFieldInfo,
  //   value: string | number | number[] | any[], control: FormControl): void {
  //   if (metaInfoSelector && tableData$) {
  //     if (field.type === ControlType.select) {
  //       value = value || null;
  //     }

  //     this.lookupListDataMap.set(metaInfoSelector, tableData$);
  //     switch (field.type) {

  //       case ControlType.selectMultiObjectJoin:
  //         tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
  //           this.crudObjectsService.setLookupJoinArrayValue(field, listData, value as any[], control);
  //         });
  //         break;

  //       // case ControlType.tableMasterDetail:
  //       //   tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
  //       //     this.crudObjectsService.setLookupValue(field, listData, value, control);
  //       //   });
  //       //   break;

  //       case ControlType.checkListObjectJoin:
  //         tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
  //           this.crudObjectsService.setLookupArrayValue(field, listData, value as any[], control);
  //         });
  //         break;

  //       case ControlType.table:
  //       case ControlType.tableJoin:
  //         tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
  //           this.crudObjectsService.setLookupObjectValue(field, listData, control);
  //         });
  //         break;
  //     }
  //   }
  // }

  public onRefreshTableData(crudTableResult: CrudTableResult) {
    this.dialogParameter.data[crudTableResult.field.name] = crudTableResult.data;
    this.refreshTableData.next(crudTableResult);
  }
}
