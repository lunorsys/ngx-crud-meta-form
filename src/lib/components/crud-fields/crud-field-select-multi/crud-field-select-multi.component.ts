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

@Component({
  selector: 'ngx-crud-field-select-multi',
  templateUrl: './crud-field-select-multi.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldSelectMultiComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;

  tableData$: BehaviorSubject<any[]>;

  constructor(
    public metaInfoService: MetaInfoService,
    public crudObjectsService: CrudObjectsService,
    @Inject(MAT_DIALOG_DATA) public dialogParameter: CrudFormParameter
  ) {
    super(metaInfoService, crudObjectsService, dialogParameter);
  }

  ngOnInit(): void {
    this.makeControl();
  }

  public setControlValue(value: any): void {
    this.tableData$ = this.crudObjectsService.getChecklistData(this.field, this.dialogParameter.data);
    this.tableData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
      this.crudObjectsService.setLookupArrayId(this.field, listData, value, this.control);
    });
  }

  public getControlValue(): any {
    return this.crudObjectsService.getLookupKeyArray(this.field, this.control?.value) || [];
  }
}
