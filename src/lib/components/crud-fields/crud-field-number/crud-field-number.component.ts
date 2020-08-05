import { Component, OnInit, Inject, ChangeDetectionStrategy, Input } from '@angular/core';
import { CrudFieldBaseComponent } from '../crud-field-base';
import { MetaInfoService } from '../../../services/meta-info.service';
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter } from '../../../models/crud.model';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import Globalize from 'globalize/dist/globalize';
import { MetaInfoTag, GenericFieldInfo } from '../../../meta-info/meta-info.model';
import { FormGroup } from '@angular/forms';
import { CrudConfig } from '../../../models/crud-config';

@Component({
  selector: 'ngx-crud-field-number',
  templateUrl: './crud-field-number.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldNumberComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;

  private numberParser: (value: string) => number;

  constructor(
    public metaInfoService: MetaInfoService,
    public crudObjectsService: CrudObjectsService,
    @Inject(MAT_DIALOG_DATA) public dialogParameter: CrudFormParameter,
    public crudConfig: CrudConfig
  ) {
    super(metaInfoService, crudObjectsService, dialogParameter, crudConfig);
  }

  ngOnInit(): void {
    this.numberParser = Globalize.numberParser();
    this.makeControl();
  }

  public setControlValue(value: any): void {
    this.control.setValue(value);
  }

  public getControlValue(): any {
    const fieldValue = this.control?.value || null;
    const numberValue = fieldValue !== null && this.numberParser(fieldValue) || null;
    return (numberValue === null || isNaN(numberValue)) ? null : numberValue;
  }
}
