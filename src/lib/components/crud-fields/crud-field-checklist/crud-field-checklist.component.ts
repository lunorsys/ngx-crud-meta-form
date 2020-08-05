import { Component, OnInit, Inject, ChangeDetectionStrategy, Input, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MetaInfoService } from '../../../services/meta-info.service';
import { MetaInfoTag, GenericFieldInfo } from '../../../meta-info/meta-info.model';
import { FormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { MatSelectionList } from '@angular/material/list';
//
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter } from '../../../models/crud.model';
import { CrudFieldBaseComponent } from '../crud-field-base';
import { CrudConfig } from '../../../models/crud-config';

@Component({
  selector: 'ngx-crud-field-checklist',
  templateUrl: './crud-field-checklist.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldChecklistComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;
  @ViewChild(MatSelectionList) selectionList: MatSelectionList;

  tableData$: BehaviorSubject<any[]>;

  constructor(
    public metaInfoService: MetaInfoService,
    public crudObjectsService: CrudObjectsService,
    @Inject(MAT_DIALOG_DATA) public dialogParameter: CrudFormParameter,
    public crudConfig: CrudConfig
  ) {
    super(metaInfoService, crudObjectsService, dialogParameter, crudConfig);
  }

  ngOnInit(): void {
    this.makeControl();
  }

  public setControlValue(value: any): void {
    this.tableData$ = this.crudObjectsService.getChecklistData(this.field, this.dialogParameter.data);
    this.tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
      this.crudObjectsService.setLookupValue(this.field, listData, value, this.control);
    });
  }

  public getControlValue(): any {
    const selectionList = this.selectionList.selectedOptions.selected.map((selectedItem) => {
      return selectedItem.value;
    });
    return this.crudObjectsService.getLookupKeyArray(this.field, selectionList);
  }

  public isSelected(item: any): boolean {
    return this.crudObjectsService.isSelected(this.dialogParameter.data, this.field, item);
  }
}
