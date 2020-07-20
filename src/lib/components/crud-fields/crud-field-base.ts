import { FormControl, FormGroup } from '@angular/forms';
import { Input, OnInit, Inject, Injectable, Component, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { MetaInfoService } from '../../services/meta-info.service';
import { MetaInfoTag, GenericFieldInfo } from '../../meta-info/meta-info.model';
import { CrudFormParameter } from '../../models/crud.model';
import { CrudObjectsService } from '../../services/crud-objects.service';
import { Subject } from 'rxjs';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
@Injectable()
export abstract class CrudFieldBaseComponent implements OnInit, OnDestroy {

  @Input() metaInfoSelector: MetaInfoTag;
  @Input() field: GenericFieldInfo;
  @Input() fieldForm: FormGroup;
  @Input() data: any;

  public control: FormControl;
  public ngUnsubscribe = new Subject();

  constructor(public metaInfoService: MetaInfoService,
    public crudObjectsService: CrudObjectsService,
    public dialogParameter: CrudFormParameter) {
  }

  ngOnInit(): void {
    this.makeControl();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  abstract setControlValue(value: any): void;
  abstract getControlValue(): any;

  // public getControl(field: GenericFieldInfo): FormControl {
  //   return this.fieldForm.get(field.name) as FormControl;
  // }

  public makeControl(): void {
    const value = this.crudObjectsService.getFieldValue(this.dialogParameter.data, this.field);
    if (this.field.validator) {
      this.control = new FormControl(value, this.field.validator);
    } else {
      this.control = new FormControl(value);
    }
    this.fieldForm.addControl(this.field.name, this.control);
    this.setControlValue(value);

    if (this.metaInfoService.getDisabled(this.dialogParameter.editAllowedList, this.field)) {
      this.control.disable();
    }
  }

  public displayLookupLine(item: any[]): string {
    const field = this.field;
    if (!field?.lookup?.getLookupValue) {
      return null;
    } else {
      return field.lookup.getLookupValue(item, []);
    }
  }

  public updateControl(data: any) {
    const value = this.crudObjectsService.getFieldValue(this.dialogParameter.data, this.field);
    this.setControlValue(value);
  }
}
