import { Component, OnInit, Inject, ChangeDetectionStrategy, Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MetaInfoService } from '../../../services/meta-info.service';
import { CrudObjectsService } from '../../../services/crud-objects.service';
import { CrudFormParameter } from '../../../models/crud.model';
import { CrudFieldBaseComponent } from '../crud-field-base';
import { MetaInfoTag, GenericFieldInfo } from '../../../meta-info/meta-info.model';
// tslint:disable-next-line: quotemark
import { FormGroup } from "@angular/forms";

@Component({
  selector: 'ngx-crud-field-checkbox',
  templateUrl: './crud-field-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFieldCheckboxComponent extends CrudFieldBaseComponent implements OnInit {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;

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
    this.control.setValue(value);
  }

  public getControlValue(): any {
    return this.control?.value ? true : false;
  }
}
