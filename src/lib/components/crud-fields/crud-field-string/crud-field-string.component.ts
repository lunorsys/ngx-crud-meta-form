import { Component, OnInit, Inject, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { CrudFieldBaseComponent } from '../crud-field-base';
import { MetaInfoService } from '../../../services/meta-info.service';
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter } from '../../../models/crud.model';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MetaInfoTag, GenericFieldInfo } from '../../../meta-info/meta-info.model';
import { FormGroup } from '@angular/forms';
import { CrudConfig } from '../../../models/crud-config';

@Component({
  selector: 'ngx-crud-field-string',
  templateUrl: './crud-field-string.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldStringComponent extends CrudFieldBaseComponent implements OnInit {

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
    this.control.setValue(value);
  }

  public getControlValue(): any {
    return this.control?.value || null;
  }
}
