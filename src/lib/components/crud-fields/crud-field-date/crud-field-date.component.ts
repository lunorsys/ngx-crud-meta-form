import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, ChangeDetectionStrategy, Input, ViewChild } from '@angular/core';
import type { FormGroup } from "@angular/forms";
//
import { CrudFieldBaseComponent } from '../crud-field-base';
import { MetaInfoService } from '../../../services/meta-info.service';
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter } from '../../../models/crud.model';
import { MetaInfoTag, GenericFieldInfo } from '../../../meta-info/meta-info.model';
import { CrudConfig } from '../../../models/crud-config';

@Component({
  selector: 'ngx-crud-field-date',
  templateUrl: './crud-field-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldDateComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;

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
    // utc
    this.control.setValue(value);
  }

  public getControlValue(): any {
    // utc
    return this.control?.value;
  }
}
