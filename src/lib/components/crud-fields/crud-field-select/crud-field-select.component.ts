import { Component, OnInit, Inject, ChangeDetectionStrategy, Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MetaInfoService } from '../../../services/meta-info.service';
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter } from '../../../models/crud.model';
import { CrudFieldBaseComponent } from '../crud-field-base';
import { MetaInfoTag, GenericFieldInfo } from '../../../meta-info/meta-info.model';
import { FormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { CrudConfig } from '../../../models/crud-config';

@Component({
  selector: 'ngx-crud-field-select',
  templateUrl: './crud-field-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldSelectComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;

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
    this.tableData$ = this.crudObjectsService.getSelectData(this.field, this.dialogParameter.data, value);
    this.tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
      this.crudObjectsService.setLookupValue(this.field, listData, value || null, this.control);
    });
  }

  public getControlValue(): any {
    return this.crudObjectsService.getLookupKey(this.field, this.control?.value || {});
  }
}
