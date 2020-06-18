import {
  Component, OnInit, Inject, OnDestroy, ChangeDetectorRef, AfterContentChecked, ViewChildren,
  QueryList, ViewChild, AfterViewInit, Output, EventEmitter
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import Globalize from 'globalize/dist/globalize';
import { takeUntil } from 'rxjs/operators';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { CrudFieldsComponent } from '../crud-fields/crud-fields.component';
import { CrudTableResult, CrudFormParameter } from '../../models/crud.model';
import { GenericFieldInfo, MetaInfo, MetaInfoTag, ControlType, _MetaInfoTag } from '../../meta-info/meta-info.model';
import { CrudService } from '../../services/crud.service';
import { MetaInfoService } from '../../services/meta-info.service';
import { MetaInfoBaseService } from '../../services/meta-info-base.service';
import { SnackBarService, SnackBarParameter, SnackBarType } from '../../services/snack-bar.service';
import { MetaInfoExtraDataService } from '../../services/meta-info-extra-data.service';
//

export class CrudFormResult {
  data: any[];
}

@Component({
  selector: 'ngx-crud-form',
  templateUrl: './crud-form.component.html',
  styleUrls: ['./crud-form.component.scss']
})
export class CrudFormComponent implements OnInit, OnDestroy, AfterContentChecked, OnDestroy, AfterViewInit {

  @ViewChildren(CrudFieldsComponent) crudFieldsComponents: QueryList<CrudFieldsComponent>;
  @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
  @Output() refreshTableData = new EventEmitter<CrudTableResult>();

  public dataready = false;
  public updateFields: GenericFieldInfo[];
  public pages: GenericFieldInfo[][][][];
  public metaInfo: MetaInfo;
  public metaInfoSelector: MetaInfoTag;
  public lookupListDataMap = new Map<MetaInfoTag, BehaviorSubject<any[]>>();
  public isSaveButtonDisabled = true;
  public tabIndex = 0;

  private primaryKeyName: string;
  private ngUnsubscribe = new Subject();
  private oldModelData = {};
  private applyModelData = null;
  private numberParser: (value: string) => number;

  ControlType = ControlType;
  MetaInfoTag = _MetaInfoTag;

  public formMap = new Map<MetaInfoTag, FormGroup>();
  constructor(private fb: FormBuilder,
    public crudFormDialogRef: MatDialogRef<any>,
    public dialog: MatDialog,
    private crudService: CrudService,
    @Inject(MAT_DIALOG_DATA) public crudFormParameter: CrudFormParameter,
    private cdref: ChangeDetectorRef,
    private metaInfoService: MetaInfoService,
    private metaInfoBaseService: MetaInfoBaseService,
    private snackBarService: SnackBarService,
    private metaInfoExtraDataService: MetaInfoExtraDataService) {
  }

  ngOnInit() {
    this.numberParser = Globalize.numberParser();
    this.metaInfo = this.metaInfoService.getMetaInfoInstance(this.crudFormParameter.metaInfoSelector);
    this.updateFields = this.metaInfoService.getUpdateFields(this.metaInfo.fields);
    this.pages = this.getPages();
    this.primaryKeyName = this.metaInfoBaseService.getPrimaryKeyName(this.metaInfo.fields);

    this.prepareForm();
    this.isSaveButtonDisabled = this.getIsSaveButtonDisabled();
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  ngAfterViewInit() {
    this.oldModelData = this.retrieveModelData();
    this.dataready = true;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private prepareForm(): void {
    this.pages.forEach((page, index) => {
      this.formMap.set(this.getMetaInfoSelector(index), this.fb.group({}));
    });
  }

  private getPages(): GenericFieldInfo[][][][] {
    const pages: GenericFieldInfo[][][][] = [];

    pages.push(this.metaInfoService.prepareFieldStructure(this.crudFormParameter.metaInfoSelector));
    if (this.metaInfo.tabPages && this.metaInfo.tabPages.length > 0) {
      this.metaInfo.tabPages.forEach((tabPage) => {
        pages.push(this.metaInfoService.prepareFieldStructure(tabPage.metaInfoSelector));
      });
    }

    return pages;
  }

  public saveForm(): void {

    const saveData = this.retrieveModelData();
    if (saveData) {
      const pageSelector = this.getMetaInfoSelector(this.tabIndex);
      const metaInfo = this.metaInfoBaseService.getMetaInfoInstance(pageSelector);
      if (this.crudFormParameter.isFormLevel && !(metaInfo && metaInfo.restPath)) {
        this.close(saveData);
      } else {
        this.save(this.crudFormParameter.parentMetaInfoselector, saveData).pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
          this.close(saveData);
        }, error => {
          const parameter: SnackBarParameter = {
            message: `Error while update: ${error} `,
            type: SnackBarType.warn
          };

          this.snackBarService.openSnackbar(parameter);
        });
      }
    } else {
      this.close(null);
    }
  }

  public save(parentMetaInfoSelector: MetaInfoTag, data: any): Observable<any> {
    return this.crudService.save(parentMetaInfoSelector, this.crudFormParameter.metaInfoSelector, data);
  }

  public applyForm(): void {
    const modelData = this.retrieveModelData();
    this.crudFormParameter.data = modelData;

    if (modelData) {
      const parentMetaInfoselector = this.crudFormParameter && this.crudFormParameter.parentMetaInfoselector;
      this.save(parentMetaInfoselector, modelData)
        .pipe(takeUntil(this.ngUnsubscribe)).subscribe((responseData: any) => {
          if (responseData && this.crudFormParameter && this.crudFormParameter.data) {
            const isUpdate = modelData[this.primaryKeyName];
            this.crudFormParameter.data[this.primaryKeyName] = responseData[this.primaryKeyName] || null;
            this.applyModelData = this.crudFormParameter.data;
            this.oldModelData = this.crudFormParameter.data;

            const parameter: SnackBarParameter = {
              message: isUpdate ? `Existing entry for ${this.metaInfo.title} was updated` :
                `New entry for ${this.metaInfo.title} was created`,
              type: SnackBarType.success
            };

            this.snackBarService.openSnackbar(parameter);
          }
        }, error => {
          const parameter: SnackBarParameter = {
            message: `Error while update: ${error} `,
            type: SnackBarType.warn
          };

          this.snackBarService.openSnackbar(parameter);
        });
    }
  }

  public retrieveModelData(): any {
    const form = this.formMap.get(this.crudFormParameter.metaInfoSelector);
    let modelData = {};
    if (form.valid) {
      const formData = this.retrieveFormData();
      modelData = this.retrieveDataFromControls(formData, this.crudFormParameter.data);
      this.preparePrimaryKeyInFormData(modelData);
    }
    return modelData;
  }

  private retrieveFormData() {
    const form = this.formMap.get(this.crudFormParameter.metaInfoSelector);
    return form && form.getRawValue();
  }

  private preparePrimaryKeyInFormData(formData: any): void {
    if (!formData) {
      return;
    }
    if (this.crudFormParameter.data) {
      formData[this.primaryKeyName] = this.crudFormParameter.data[this.primaryKeyName] || null;
    } else {
      formData[this.primaryKeyName] = null;
    }
  }

  private retrieveDataFromControls(formData: any, originData: any[]): any {
    if (!this.updateFields || !this.crudFieldsComponents) {
      return null;
    }
    const saveData: any = {};
    this.updateFields.forEach(field => {
      const fieldValue = formData[field.name];
      switch (field.type) {
        case ControlType.number:
          const numberValue = fieldValue ? this.numberParser(fieldValue) : null;
          saveData[field.name] = numberValue === null || isNaN(numberValue) ? null : numberValue;
          break;
        case ControlType.boolean:
          saveData[field.name] = fieldValue ? true : false;
          break;
        case ControlType.select:
        case ControlType.selectAutocomplete:
          saveData[field.name] = this.metaInfoService.getLookupKey(field, fieldValue || {});
          break;
        case ControlType.selectMulti:
          saveData[field.name] = this.metaInfoService.getLookupKeyArray(field, fieldValue || []);
          break;
        case ControlType.selectMultiObject:
          saveData[field.name] = this.metaInfoService.getLookupObjectArray(field, fieldValue, fieldValue);
          break;
        case ControlType.referenceByParentData:
          saveData[field.name] = this.crudFormParameter.parentData[field.name];
          break;
        case ControlType.referenceByExtraData:
          saveData[field.name] = this.metaInfoExtraDataService.getExtraData(field.name);
          break;
        case ControlType.checkList:
          this.crudFieldsComponents.forEach((crudfield) => {
            if (crudfield.field.name === field.name) {
              saveData[field.name] = this.metaInfoService.getLookupKeyArray(field, crudfield.getSelectionList());
            }
          });
          break;
        case ControlType.checkListObject:
          this.crudFieldsComponents.forEach((crudfield) => {
            if (crudfield.field.name === field.name) {
              saveData[field.name] = this.metaInfoService.getLookupObjectArray(field, originData, crudfield.getSelectionList());
            }
          });
          break;
        case ControlType.tableMasterDetail:
          // No result expected, because it is already saved!
          // The deal with backend is, that content=null for association, no changes will applied
          saveData[field.name] = null;
          break;
        case ControlType.table:
          saveData[field.name] = originData[field.name];
          break;

        default:
          saveData[field.name] = fieldValue;
          break;
      }
    });

    return saveData;
  }

  private close(saveData: any): void {
    this.crudFormDialogRef.close(saveData);
  }

  public closeForm(): void {
    let saveData = null;
    if (this.applyModelData && this.hasFormChanged()) {
      saveData = this.applyModelData;
    }
    this.crudFormDialogRef.close(saveData);
  }

  public getFormDialogWidth(): string {
    return (this.metaInfo && this.metaInfo.formWidth ?
      this.metaInfo.formWidth : '500') + ' !important';
  }

  public isNewRow(field: GenericFieldInfo): boolean {
    return field.formatOption && field.formatOption.beginFieldRow;
  }

  public getGroupHeader(group: GenericFieldInfo[][]): string {
    return (group && group.length && group[0].length && group[0][0].formatOption) ? group[0][0].formatOption.groupName : '';
  }

  public showApplyButton(): boolean {
    if (!this.crudFormParameter || !this.metaInfo || !this.crudFormParameter.data) {
      return false;
    } else {
      return (!this.crudFormParameter.data[this.primaryKeyName] && this.hasMasterDetailChildTable()) || this.hasTabs();
    }
  }

  private getIsSaveButtonDisabled(): boolean {
    const form = this.formMap.get(this.crudFormParameter.metaInfoSelector);
    const isDisabled = !this.metaInfo.fields.some((field) => {
      const isEnabled = this.isEnabled(field);
      const editAllowed = !this.crudFormParameter.editAllowedList || this.crudFormParameter?.editAllowedList.includes(field.name);
      const fieldWriteable = !field?.readonly && isEnabled && !field.isPrimaryKey && editAllowed;
      return fieldWriteable;
    });
    return this.tabIndex > 0 || form.invalid || isDisabled;
  }

  public isApplyButtonDisabled(): boolean {
    return this.tabIndex > 0 || this.formMap.get(this.crudFormParameter.metaInfoSelector).invalid;
  }

  private hasMasterDetailChildTable(): boolean {
    return this.metaInfo.fields.some((field) => field.type === ControlType.tableMasterDetail);
  }

  public isCheckListEmpty(field: GenericFieldInfo): boolean {
    const data = this.crudFormParameter && this.crudFormParameter.data && this.crudFormParameter.data[field.name];
    return !data || !(data instanceof Array);
  }

  public displayDefaultLookupLine(): string {
    return MetaInfoService.defaultSelectDisplayLine;
  }

  public getFlexParameter(field: GenericFieldInfo): string {
    return field.formatOption && field.formatOption.formFlexParameter ? field.formatOption.formFlexParameter : '1 1 100%';
  }

  public isEnabled(field: GenericFieldInfo): boolean {
    return (field.disabled === undefined || !field.disabled) &&
      !(this.crudFormParameter.hideList && this.crudFormParameter.hideList.indexOf(field.name) > -1);
  }

  public hasTabs(): boolean {
    return this.metaInfoService.hasTabs(this.metaInfo);
  }

  public getMetaInfoSelector(index: number): MetaInfoTag {
    return this.metaInfo && this.metaInfo.tabPages && index > 0 ?
      this.metaInfo.tabPages?.[index - 1]?.metaInfoSelector : this.crudFormParameter.metaInfoSelector;
  }

  public getTabLabel(index: number): string {
    return this.metaInfo && this.metaInfo.tabPages && index > 0 ?
      this.metaInfo.tabPages?.[index - 1]?.title : this.metaInfo.title;
  }

  public getJoinedTableData(index: number): BehaviorSubject<any[]> {
    const pageSelector = this.getMetaInfoSelector(index);
    return this.lookupListDataMap.get(pageSelector);
  }

  public getPrimaryKey(index: number) {
    const pageSelector = this.getMetaInfoSelector(index);
    const pageMetaInfo = this.metaInfoBaseService.getMetaInfoInstance(pageSelector);
    return pageMetaInfo.fields.find(field => field.isPrimaryKey);
  }

  public tabClick(event: MatTabChangeEvent): void {
    this.tabIndex = event.index;
    if (event.index > 0) {
      this.selectNewTabPage(event.index);
    } else {
      this.crudFormParameter.data = this.oldModelData;
      this.updateControls(this.oldModelData);
    }
  }

  public hasFormChanged(): boolean {
    return this.dataready && this.tabIndex === 0 &&
      !this.metaInfoService.isEqualModel(this.metaInfo, this.oldModelData, this.retrieveModelData());
  }

  private selectNewTabPage(index: number) {
    const pageSelector = this.getMetaInfoSelector(index);
    if (!this.lookupListDataMap.get(pageSelector)) {
      const detailData$ = this.metaInfoService.getJoinedTableData(this.getMetaInfoSelector(0), pageSelector, this.crudFormParameter.data);
      this.lookupListDataMap.set(pageSelector, detailData$);
    }
  }

  public getForm(pageIndex: number) {
    return this.formMap.get(this.getMetaInfoSelector(pageIndex));
  }

  public onRefreshTableData(crudTableResult: CrudTableResult) {
    this.crudFormParameter.data[crudTableResult.field.name] = crudTableResult.data;
    if (this.tabIndex > 0) {
      const pageSelector = this.getMetaInfoSelector(this.tabIndex);
      if (pageSelector) {
        const detailData$ = this.metaInfoService.getJoinedTableData(this.getMetaInfoSelector(0), pageSelector, this.crudFormParameter.data);
        this.lookupListDataMap.set(pageSelector, detailData$);
      }
    } else {
      const metaInfoSelector = crudTableResult.field?.lookup?.metaInfoSelector;
      if (metaInfoSelector) {
        this.lookupListDataMap.set(metaInfoSelector, new BehaviorSubject<any[]>(crudTableResult.data));
      }
    }
  }

  private updateControls(modelData: any) {
    this.crudFieldsComponents.forEach(crudField => {
      crudField.updateControl(modelData);
    });
  }
}

