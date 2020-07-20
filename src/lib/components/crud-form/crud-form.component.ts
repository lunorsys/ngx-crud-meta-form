import { MessageDialogService } from './../../services/message-dialog.service';
import { ControlType } from './../../meta-info/meta-info.model';
import {
  Component, OnInit, Inject, OnDestroy, ChangeDetectorRef, ViewChildren,
  QueryList, ViewChild, AfterViewInit, Output, EventEmitter, ChangeDetectionStrategy, AfterContentChecked
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Subject, Observable, BehaviorSubject, of } from 'rxjs';
import { takeUntil, share } from 'rxjs/operators';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { CrudFieldsComponent } from '../crud-fields/crud-fields.component';
import { CrudTableResult, CrudFormParameter } from '../../models/crud.model';
import { GenericFieldInfo, MetaInfo, MetaInfoTag, _MetaInfoTag } from '../../meta-info/meta-info.model';
import { CrudService } from '../../services/crud.service';
import { CrudObjectsService } from '../../services/crud-objects.service';
import { SnackBarService, SnackBarParameter, SnackBarType } from '../../services/snack-bar.service';
import { MetaInfoService } from '../../services/meta-info.service';

export class CrudFormResult {
  data: any[];
}

@Component({
  selector: 'ngx-crud-form',
  templateUrl: './crud-form.component.html',
  styleUrls: ['./crud-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrudFormComponent implements OnInit, OnDestroy, OnDestroy, AfterViewInit, AfterContentChecked {

  @ViewChildren(CrudFieldsComponent) crudFieldsComponents: QueryList<CrudFieldsComponent>;
  @ViewChild('tabGroup') tabGroup: MatTabGroup;
  @Output() refreshTableData = new EventEmitter<CrudTableResult>();

  public dataready = false;
  public updateFields: GenericFieldInfo[];
  public pages: GenericFieldInfo[][][][];
  public metaInfo: MetaInfo;
  public metaInfoSelector: MetaInfoTag;
  public lookupListDataMap = new Map<MetaInfoTag, BehaviorSubject<any[]>>();
  public tabIndex = 0;
  public isSaveButtonDisabled = false;
  public showApplyButton = false;
  public firstForm: FormGroup;
  public primaryKeyName: string;

  private ngUnsubscribe = new Subject();
  private oldModelData = {};
  private applyModelData = null;

  ControlType = ControlType;
  MetaInfoTag = _MetaInfoTag;
  SnackBarType = SnackBarType;

  public formMap = new Map<MetaInfoTag, FormGroup>();
  constructor(private fb: FormBuilder,
    public crudFormDialogRef: MatDialogRef<any>,
    public dialog: MatDialog,
    private crudService: CrudService,
    @Inject(MAT_DIALOG_DATA) public crudFormParameter: CrudFormParameter,
    private crudObjectsService: CrudObjectsService,
    private snackBarService: SnackBarService,
    private changeDetection: ChangeDetectorRef,
    private metaInfoService: MetaInfoService,
    private messageDialogService: MessageDialogService) {

    this.metaInfoSelector = this.getMetaInfoSelector(0);
  }

  ngOnInit(): void {
    this.metaInfo = this.metaInfoService.getMetaInfoInstance(this.crudFormParameter.metaInfoSelector);
    this.updateFields = this.metaInfoService.getUpdateFields(this.metaInfo.fields);
    this.pages = this.getPages();
    this.primaryKeyName = this.metaInfoService.getPrimaryKeyName(this.metaInfo.fields);

    this.prepareForm();

    this.isSaveButtonDisabled = this.getIsSaveButtonDisabled();
    this.showApplyButton = this.getShowApplyButton();
    this.firstForm = this.formMap.get(this.crudFormParameter.metaInfoSelector);
  }

  ngAfterViewInit(): void {
    this.oldModelData = this.retrieveModelData();
  }

  ngAfterContentChecked(): void {
    this.changeDetection.detectChanges();
    setTimeout(() => {
      this.dataready = true;
    });
  }

  ngOnDestroy(): void {
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
    this.applyForm().pipe(takeUntil(this.ngUnsubscribe)).subscribe((modelData: any) => {
      if (modelData) {
        this.close(modelData);
      }
    });
    // const modelData = this.retrieveModelData();
    // if (modelData) {
    //   const pageSelector = this.getMetaInfoSelector(this.tabIndex);
    //   const metaInfo = this.metaInfoService.getMetaInfoInstance(pageSelector);
    //   if (this.crudFormParameter.isFormLevel && !(metaInfo && metaInfo.restPath)) {
    //     this.close(modelData);
    //   } else {
    //     this.save(this.crudFormParameter.parentMetaInfoSelector, modelData, this.crudFormParameter.parentData)
    //       .pipe(takeUntil(this.ngUnsubscribe)).subscribe((resultData: any) => {
    //         this.crudObjectsService.setPrimaryKeyValue(this.crudFormParameter.parentMetaInfoSelector, resultData, modelData);
    //         this.close(modelData);
    //       }, error => {
    //         const dialogParameter: SnackBarParameter = {
    //           message: `Error while update: ${error} `,
    //           type: SnackBarType.warn
    //         };
    //         this.snackBarService.openSnackbar(dialogParameter);
    //       });
    //   }
    // } else {
    //   this.close(null);
    // }
  }

  public applyForm(): Observable<any> {
    const modelData = this.retrieveModelData();
    this.crudFormParameter.data = modelData;
    let applyResult$ = null;

    if (modelData) {
      const isUpdate = modelData[this.primaryKeyName];
      applyResult$ = this.save(this?.crudFormParameter?.parentMetaInfoSelector, modelData, this.crudFormParameter.parentData).pipe(share());
      applyResult$.pipe(takeUntil(this.ngUnsubscribe)).subscribe((resultData: any) => {
        if (resultData && this?.crudFormParameter?.data) {
          // this.crudObjectsService.setPrimaryKeyValue(this.crudFormParameter.parentMetaInfoSelector, resultData, modelData);
          this.applyModelData = this.crudFormParameter.data;
          this.oldModelData = this.crudFormParameter.data;

          const dialogParameter: SnackBarParameter = {
            message: isUpdate ? `Existing entry for ${this.metaInfo.title} was updated` :
              `New entry for ${this.metaInfo.title} was created`,
            type: SnackBarType.success
          };

          this.snackBarService.openSnackbar(dialogParameter);
          // this.changeDetection.markForCheck();
          this.firstForm.markAsPristine();
        }
      }, (error: string) => {
        const dialogParameter: SnackBarParameter = {
          message: `Error while update: ${error}`,
          type: SnackBarType.warn
        };

        this.snackBarService.openSnackbar(dialogParameter);
        // this.changeDetection.markForCheck();
      });
    } else {
      applyResult$ = of(null);
    }

    return applyResult$;
  }

  public save(parentMetaInfoSelector: MetaInfoTag, data: any, parentData: any): Observable<any> {
    return this.crudService.save(parentMetaInfoSelector, this.crudFormParameter.metaInfoSelector, data, parentData);
  }

  private retrieveModelData(): any {
    const saveData: any = {};
    const form = this.formMap.get(this.crudFormParameter.metaInfoSelector);
    if (form.valid) {
      this.crudFieldsComponents.forEach((crudField) => {
        const field = crudField.field;
        if (field.type === ControlType.referenceByParentData) {
          saveData[field.name] = this.crudFormParameter.parentData[field.name];
        } else {
          saveData[field.name] = crudField.getControlValue();
        }
      });
      this.preparePrimaryKeyInFormData(saveData);
    }
    return saveData;
  }

  private preparePrimaryKeyInFormData(saveData: any): void {
    if (!saveData) {
      return;
    }
    if (this.crudFormParameter.data) {
      saveData[this.primaryKeyName] = this.crudFormParameter.data[this.primaryKeyName] || null;
    } else {
      saveData[this.primaryKeyName] = null;
    }
  }

  // private mapModelData(formData: any, data: any[], parentData: any[]): any {
  //   if (!this.updateFields) {
  //     return null;
  //   }

  //   const saveData: any = {};
  //   this.crudFieldsComponents.forEach((crudField) => {
  //     saveData[crudField.field.name] = crudField.getControlValue();
  //   });

  //   // this.updateFields.forEach(field => {
  //   //   const fieldValue = formData[field.name];
  //   //   switch (field.type) {
  //   //     case ControlType.number:
  //   //     case ControlType.string:
  //   //     case ControlType.boolean:
  //   //     case ControlType.select:
  //   //     case ControlType.selectMulti:
  //   //     case ControlType.selectMultiObject:
  //   //     case ControlType.checkList:
  //   //     case ControlType.checkListObject:
  //   //     case ControlType.tableMasterDetail:
  //   //     case ControlType.referenceByParentData:
  //   //       break;

  //   //     case ControlType.selectAutocomplete:
  //   //       saveData[field.name] = this.crudObjectsService.getLookupKey(field, fieldValue || {});
  //   //       break;

  //   //     case ControlType.selectMultiObjectJoin:
  //   //       saveData[field.name] = this.crudObjectsService.getLookupObjectArray(field, data, fieldValue);
  //   //       break;

  //   //     case ControlType.table:
  //   //     case ControlType.tableJoin:
  //   //       saveData[field.name] = data[field.name];
  //   //       break;
  //   //     default:
  //   //       saveData[field.name] = fieldValue;
  //   //       break;
  //   //   }
  //   // });

  //   return saveData;
  // }

  private close(saveData: any): void {
    this.crudFormDialogRef.close(saveData);
  }

  public closeForm(): void {
    let saveData = null;
    if (this.applyModelData && this.firstForm.valid) {
      saveData = this.applyModelData;
    }
    this.crudFormDialogRef.close(saveData);
  }

  public getFormDialogWidth(): string {
    return (this.metaInfo && this.metaInfo.formWidth ?
      this.metaInfo.formWidth : '500') + ' !important';
  }

  public isNewRow(field: GenericFieldInfo): boolean {
    return field?.formatOption?.beginFieldRow;
  }

  public getGroupHeader(group: GenericFieldInfo[][]): string {
    return group[0]?.[0]?.formatOption?.groupName;
  }

  public getShowApplyButton(): boolean {
    if (!this.crudFormParameter || !this.metaInfo) {
      return false;
    } else {
      return (!this.primaryKeyName && this.hasMasterDetailChildTable()) || this.hasTabs();
    }
  }

  public getIsSaveButtonDisabled(): boolean {
    const isDisabled = !this.metaInfo.fields.some((field) => {
      const isEnabled = this.isEnabled(field);
      const editAllowed = !this.crudFormParameter.editAllowedList || this.crudFormParameter?.editAllowedList.includes(field.name);
      const fieldWriteable = !field?.readonly && isEnabled && !field.isPrimaryKey && editAllowed;
      return fieldWriteable;
    });
    // console.log('\'isSaveButtonDisabled\' was called');
    return isDisabled;
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
    return CrudObjectsService.defaultSelectDisplayLine;
  }

  public getFlexParameter(field: GenericFieldInfo): string {
    return field.formatOption?.formFlexParameter ?? '1 1 100%';
  }

  public isEnabled(field: GenericFieldInfo): boolean {
    return (field.disabled === undefined || !field.disabled) &&
      !(this.crudFormParameter.hideList && this.crudFormParameter.hideList.indexOf(field.name) > -1);
  }

  public hasTabs(): boolean {
    return this.metaInfoService.hasTabs(this.metaInfo) ?? false;
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

  public getPrimaryKey(index: number): GenericFieldInfo {
    const pageSelector = this.getMetaInfoSelector(index);
    const pageMetaInfo = this.metaInfoService.getMetaInfoInstance(pageSelector);
    return pageMetaInfo.fields.find(field => field.isPrimaryKey);
  }

  public tabClick(event: MatTabChangeEvent): void {
    this.firstForm.updateValueAndValidity();
    if (this.firstForm.dirty && this.tabGroup.selectedIndex > 0) {
      this.messageDialogService.showConfirmDialog(`You have unsaved changes. Would you like to proceed and discard the changes?`)
        .afterClosed().pipe((takeUntil(this.ngUnsubscribe))).subscribe((proceed: boolean) => {
          if (!proceed) {
            this.tabGroup.selectedIndex = 0;
          }
        });
    }
    this.tabIndex = event.index;
    if (event.index > 0) {
      this.selectNewTabPage(event.index);
    } else {
      this.crudFormParameter.data = this.oldModelData;
      // this.updateControls(this.oldModelData);
    }
  }

  private selectNewTabPage(index: number): void {
    const pageSelector = this.getMetaInfoSelector(index);
    if (!this.lookupListDataMap.get(pageSelector)) {
      const detailData$ = this.crudObjectsService.getJoinedTableData(this.getMetaInfoSelector(0),
        pageSelector, this.crudFormParameter.data);
      this.lookupListDataMap.set(pageSelector, detailData$);
    }
  }

  public getForm(pageIndex: number): FormGroup {
    return this.formMap.get(this.getMetaInfoSelector(pageIndex));
  }

  public onRefreshTableData(crudTableResult: CrudTableResult): void {
    // this.crudFormParameter.data[crudTableResult.field.name] = crudTableResult.data;
    if (this.tabIndex > 0) {
      const pageSelector = this.getMetaInfoSelector(this.tabIndex);
      if (pageSelector) {
        const detailData$ = this.crudObjectsService.getJoinedTableData(this.getMetaInfoSelector(0),
          pageSelector, this.crudFormParameter.data);
        this.lookupListDataMap.set(pageSelector, detailData$);
        detailData$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => this.changeDetection.markForCheck());
      }
    } else {
      const metaInfoSelector = crudTableResult.field?.lookup?.metaInfoSelector;
      if (metaInfoSelector) {
        this.lookupListDataMap.set(metaInfoSelector, new BehaviorSubject<any[]>(crudTableResult.data));
      }
    }
    // this.changeDetection.markForCheck();
  }
}

