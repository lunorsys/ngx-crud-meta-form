import { Component, OnInit, Inject, ChangeDetectionStrategy, Input, ViewChild, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MetaInfoService } from '../../../services/meta-info.service';
import { MetaInfoTag, GenericFieldInfo, _MetaInfoTag } from '../../../meta-info/meta-info.model';
import { FormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { MatSelectionList } from '@angular/material/list';
//
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter, CrudTableResult } from '../../../models/crud.model';
import { CrudFieldBaseComponent } from '../crud-field-base';

@Component({
  selector: 'ngx-crud-field-table',
  templateUrl: './crud-field-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldTableComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;
  @Input() sourceField: GenericFieldInfo;
  @Input() parentData: any = {};
  @Input() parentMetaInfoSelector: MetaInfoTag = _MetaInfoTag.Undefined;
  @ViewChild(MatSelectionList) selectionList: MatSelectionList;
  @Output() refreshTableData = new EventEmitter<CrudTableResult>();

  @Input() set metaInfoSelector(metaInfoSelector: MetaInfoTag) {
    this._metaInfoSelector = metaInfoSelector;
  }
  get metaInfoSelector(): string {
    return this._metaInfoSelector;
  }

  @Input() set isReadonly(isReadonly: boolean) {
    this._isReadonly = isReadonly;
  }
  get isReadonly(): boolean {
    return this._isReadonly;
  }

  @Input() set filter(filter: string) {
    this._filter = filter;
  }
  get filter(): string {
    return this._filter;
  }

  public tableData$: BehaviorSubject<any[]>;
  private _isReadonly: boolean;
  private _metaInfoSelector: MetaInfoTag;
  private _filter: string;

  constructor(
    public metaInfoService: MetaInfoService,
    public crudObjectsService: CrudObjectsService,
    @Inject(MAT_DIALOG_DATA) public dialogParameter: CrudFormParameter,
    private changeDetection: ChangeDetectorRef,
  ) {
    super(metaInfoService, crudObjectsService, dialogParameter);
  }

  ngOnInit(): void {
    this.makeControl();
  }

  public setControlValue(value: any): void {
    this.tableData$ = this.crudObjectsService.getJoinedTableData(this.dialogParameter.metaInfoSelector,
      this.metaInfoSelector, this.dialogParameter.data);
    // this.tableData$ = this.crudObjectsService.getJoinedTableData(this.parentMetaInfoSelector,
    //   this.metaInfoSelector, this.dialogParameter.data);
    this.tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
      this.crudObjectsService.setLookupValue(this.field, listData, value, this.control);
      this.changeDetection.markForCheck();
    });
  }

  public getControlValue(): any {
    // No result expected, because it is already saved in joined table
    return null;
  }
}
