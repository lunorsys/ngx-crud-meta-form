import { Component, Inject, ChangeDetectionStrategy, Input, OnInit } from '@angular/core';
import { CrudFieldBaseComponent } from '../crud-field-base';
import { MetaInfoService } from '../../../services/meta-info.service';
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter } from '../../../models/crud.model';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GenericFieldInfo } from '../../../meta-info/meta-info.model';

@Component({
  selector: 'ngx-crud-placeholder',
  templateUrl: './crud-field-placeholder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldPlaceholderComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() field: GenericFieldInfo;

  constructor(
    public metaInfoService: MetaInfoService,
    public crudObjectsService: CrudObjectsService,
    @Inject(MAT_DIALOG_DATA) public dialogParameter: CrudFormParameter,
  ) {
    super(metaInfoService, crudObjectsService, dialogParameter);
  }

  ngInit() {
    this.makeControl();
  }

  public setControlValue(value: any): void { }
  public getControlValue(): any {
    return null;
  }
}
