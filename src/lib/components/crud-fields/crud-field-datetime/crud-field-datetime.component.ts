import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, ChangeDetectionStrategy, Input } from '@angular/core';
import type { FormGroup } from '@angular/forms';
//
import { CrudFieldBaseComponent } from '../crud-field-base';
import { MetaInfoService } from '../../../services/meta-info.service';
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter } from '../../../models/crud.model';
import { MetaInfoTag, GenericFieldInfo } from '../../../meta-info/meta-info.model';
import { CrudConfig } from '../../../models/crud-config';
import moment from 'moment';
import { LocalConvertService } from '../../../services/locale-convert.service';

@Component({
  selector: 'ngx-crud-field-datetime',
  templateUrl: './crud-field-datetime.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldDatetimeComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;

  constructor(
    public metaInfoService: MetaInfoService,
    public crudObjectsService: CrudObjectsService,
    @Inject(MAT_DIALOG_DATA) public dialogParameter: CrudFormParameter,
    public crudConfig: CrudConfig,
  ) {
    super(metaInfoService, crudObjectsService, dialogParameter, crudConfig);
  }

  ngOnInit(): void {
    this.makeControl();
  }

  public setControlValue(value: any): void {
    // utc
    const datetime = moment(value);
    const result = datetime.subtract(datetime.utcOffset(), 'minutes').toISOString();
    this.control.setValue(result);
  }

  public getControlValue(): any {
    // utc
    const datetime = moment(this.control?.value).second(0).millisecond(0).utc(true);
    return datetime.toISOString();
  }

  public hasDate(): boolean {
    return false;
  }

  public clearDate(): void {
  }

  public hasAmPmSupport(): boolean {
    return this.crudConfig.hasAmPmSupport;
  }
}
