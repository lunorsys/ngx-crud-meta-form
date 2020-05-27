import {
  Component, OnInit, ViewChild, Input, OnDestroy, Output, EventEmitter, ChangeDetectorRef,
  AfterContentChecked,
  Inject,
} from '@angular/core';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';
import Globalize from 'globalize/dist/globalize';
//
import { MetaInfo, MetaInfoTag, GenericFieldInfo, ControlType, _MetaInfoTag } from '../../meta-info/meta-info.model';
import { CrudTableResult, CrudFormParameter } from '../../models/crud.model';
import { MetaInfoService } from '../../services/meta-info.service';
import { CrudService } from '../../services/crud.service';
import { MetaInfoBaseService } from '../../services/meta-info-base.service';
import { MetaInfoExtraDataService } from '../../services/meta-info-extra-data.service';
import { SnackBarService, SnackBarParameter, SnackBarType } from '../../services/snack-bar.service';
import { CrudFormComponent, CrudFormResult } from '../crud-form/crud-form.component';
import { CACHE_TOKEN, ICacheService } from '../../interfaces/icache.service';

@Component({
  selector: 'ngx-crud-table',
  templateUrl: './crud-table.component.html',
  styleUrls: ['./crud-table.component.scss']
})
export class CrudTableComponent implements OnInit, OnDestroy, AfterContentChecked {

  private init = true;
  _listData = [];
  @Input() set listData(listData: any[]) {
    this._listData = [];
    if (this.init && listData && listData.length > 0) {
      this._listData = cloneDeep(listData);
      this.dataSource.data = this._listData;
      this.dataSource.paginator = this.paginator;
    } else {
      this.dataSource.data = [];
    }
  }
  get listData() {
    return this._listData;
  }

  metaTableInfo: MetaInfo;
  metaInfo: MetaInfo;
  _metaInfoSelector: MetaInfoTag;
  @Input() set metaInfoSelector(metaInfoSelector: MetaInfoTag) {

    const metaInfo = this.metaInfoBaseService.getMetaInfoInstance(metaInfoSelector);
    this._metaInfoSelector = metaInfoSelector;
    if (metaInfo) {
      this.metaTableInfo = cloneDeep(metaInfo);
      this.metaTableInfo.fields = metaInfo.fields ? cloneDeep(metaInfo.fields.filter((item) => item.isTableColumn)) : [];
      this.displayedColumns = this.metaTableInfo.fields.map((item) => item.name);
      this.displayedColumns.push('edit');
      this.metaInfo = cloneDeep(metaInfo);
    } else {
      this.metaInfo = null;
    }
  }
  get metaInfoSelector() {
    return this._metaInfoSelector;
  }

  displayedColumns: string[];
  _filter: string;
  @Input() set filter(filter: string) {
    if (this.init) {
      this._filter = filter;
      this.dataSource.filter = filter;
    }
  }
  get filter() {
    return this._filter;
  }

  _isReadonly: boolean;
  @Input() set isReadonly(isReadonly: boolean) {
    this._isReadonly = isReadonly;
  }
  get isReadonly(): boolean {
    return this._isReadonly;
  }

  @Input() paginator: MatPaginator;
  @Input() isFormLevel = false;
  @Input() sourceField: GenericFieldInfo;
  @Input() parentData: any = {};
  @Input() parentMetaInfoselector: MetaInfoTag = _MetaInfoTag.Undefined;
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatAutocomplete) autocomplete: MatAutocomplete;
  @Output() refreshTableData = new EventEmitter<CrudTableResult>();

  public isLoadingResults = true;
  public dataSource = new MatTableDataSource<any>();
  public dataready: Observable<boolean> = of(false);
  ControlType = ControlType;

  private numberFormatter;
  private ngUnsubscribe = new Subject();

  constructor(private dialog: MatDialog,
    @Inject(CACHE_TOKEN) private cacheService: ICacheService,
    private crudService: CrudService,
    private cdref: ChangeDetectorRef,
    private metaInfoService: MetaInfoService,
    private metaInfoBaseService: MetaInfoBaseService,
    private snackBarService: SnackBarService,
    private extraDataService: MetaInfoExtraDataService) {

    this.metaTableInfo = new MetaInfo();
    this.metaInfo = new MetaInfo();
    this.dataSource.data = [];
    this.listData = [];
  }

  ngOnInit() {
    this.numberFormatter = Globalize.numberFormatter();
    this.dataSource.filter = this.filter;
    this.cacheService.isCacheAvailable.pipe(takeUntil(this.ngUnsubscribe)).subscribe((isAvailable) => {
      if (isAvailable) {
        this.setupSort();
        this.setupFilter();
        this.setupSortingDataAccessor();
        this.dataready = of(true);
      }
    });
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  ngOnDestroy() {
    this.dataSource.disconnect();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setupSortingDataAccessor(): void {
    this.dataSource.sortingDataAccessor = (data: any, sortHeaderId: string): string | number => {
      if (!this.metaTableInfo || !this.metaTableInfo.fields) {
        return null;
      }
      const sortField = this.metaTableInfo.fields.find((controlItem) => sortHeaderId === controlItem.name);
      if (!sortField) {
        return null;
      }
      let value: any;

      if (this.metaInfoService.isLookupField(sortField)) {
        if (sortField.lookup) {
          const lookupKeyMetaInfo = this.metaInfoService.getMetaInfoInstance(sortField.lookup.metaInfoSelector);
          if (lookupKeyMetaInfo) {
            let lookupValuePreSortedItem = lookupKeyMetaInfo.fields.find((item: GenericFieldInfo) => item.isPreSortedItem);
            if (!lookupValuePreSortedItem) {
              lookupValuePreSortedItem = lookupKeyMetaInfo.fields.find((item: GenericFieldInfo) =>
                (item.type === ControlType.number || item.type === ControlType.string) && item.isTableColumn);
              if (!lookupValuePreSortedItem) {
                this.sort = null;
              }
            }
            const lookupKey = data[sortHeaderId];
            if (lookupKey && lookupValuePreSortedItem) {
              const listData = this.cacheService.getCachedTable(sortField.lookup.metaInfoSelector);
              const lookupValue = listData.find((lookupItem) => lookupItem[sortHeaderId] === lookupKey);
              value = lookupValue && lookupValue[lookupValuePreSortedItem.name];
              value = value && (value as string).toLowerCase();
            }
          }
        } else {
          value = data[sortHeaderId];
        }
      } else {
        switch (sortField.type) {
          case ControlType.string:
            value = data[sortHeaderId];
            value = value && (value as string).toLowerCase();
            break;
          default:
            value = data[sortHeaderId];
            break;
        }
      }
      return value;
    };

    this.setupSort();
  }

  public applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue;
  }

  public getFieldValue(data: any, field: GenericFieldInfo, isFormLevel: boolean, metaInfo: MetaInfo): any {
    const value = data[field.name];
    if (!value && field.type !== ControlType.number ||
      value === null ||
      field.type === ControlType.number && isNaN(value)) {
      return '';
    }

    let result = null;
    let numberValue: number;
    switch (field.type) {

      case ControlType.number:
        if (typeof value === 'string') {
          numberValue = Number(value);
        } else {
          numberValue = value;
        }
        result = this.numberFormatter(numberValue);
        break;

      case ControlType.select:
      case ControlType.selectAutocomplete:
        result = this.metaInfoService.getLookupValueById(field, value);
        break;

      default:
        result = value;
        break;
    }

    return result;
  }

  public updateEntry(data: any): void {
    this.editEntry(data);
  }

  public createEntry(): void {
    this.editEntry(null);
  }

  public editEntry(data: any): void {
    if (this.metaInfo.restPath) {
      const restPath = this.metaInfoBaseService.extractRestPath(this.metaInfo, data);
      const primaryKey = this.metaInfoBaseService.getPrimaryKeyName(this.metaInfo.fields);
      if (restPath && primaryKey && data && data[primaryKey]) {
        this.crudService.get(this.metaInfoSelector, data).pipe(takeUntil(this.ngUnsubscribe)).subscribe((childData) => {
          const dialogRef = this.openCrudForm(childData);
          this.afterCloseCrudForm(dialogRef, data);
        }, err => {
          console.log('error: ' + err);
        });
      } else {
        const dialogRef = this.openCrudForm(data || {});
        this.afterCloseCrudForm(dialogRef, data);
      }
    } else {
      const dialogRef = this.openCrudForm(data || {});
      this.afterCloseCrudForm(dialogRef, data);
    }
  }

  public deleteEntry(data: any): void {
    this.crudService.delete(this.metaInfoSelector, data).pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.updateAfterDelete(data);
    }, error => {
      const parameter: SnackBarParameter = {
        message: `Error while delete: ${error} `,
        type: SnackBarType.warn
      };

      this.snackBarService.openSnackbar(parameter);
    });
  }

  private updateAfterDelete(data: any): any[] {
    const filteredData = this.dataSource.data.filter((item) => data !== item);
    this.listData = filteredData;
    if (this.sourceField) {
      this.refreshTableData.next(<CrudTableResult>{
        data: filteredData,
        field: this.sourceField
      });
    }
    return filteredData;
  }

  private afterCloseCrudForm(dialogRef: MatDialogRef<CrudFormComponent, CrudFormResult>, oldData: any) {
    dialogRef.afterClosed().pipe(takeUntil(this.ngUnsubscribe)).subscribe((saveData) => {
      if (saveData) {
        if (oldData) {
          Object.assign(oldData, saveData);
        } else {
          this.listData.push(saveData);
          this.dataSource.data = this.listData;
        }
        this.setupSort();
        this.refreshTableData.next(<CrudTableResult>{
          data: this.dataSource.data,
          field: this.sourceField
        });

        this.isLoadingResults = true;
      }
    });
  }

  private openCrudForm(data: any): MatDialogRef<CrudFormComponent, CrudFormResult> {
    const matConfig: MatDialogConfig = {
      data: {
        data: data,
        metaInfoSelector: this.metaInfoSelector,
        isFormLevel: this.isFormLevel,
        parentData: this.parentData,
        parentMetaInfoselector: this.parentMetaInfoselector,
      },
      disableClose: true,
      width: this.metaInfoService.getFormDialogWidth(this.metaInfo),
      maxHeight: '80%'
    };

    if (this.metaInfoService.hasTabs(this.metaInfo)) {
      matConfig.panelClass = 'crud-modal-container-tab';
    } else {
      matConfig.panelClass = 'crud-modal-container-page';
    }

    return this.dialog.open<CrudFormComponent, CrudFormParameter, CrudFormResult>(CrudFormComponent, matConfig);
  }

  public getflexParameter(field: GenericFieldInfo) {
    return field.formatOption && field.formatOption.tableFlexParameter ? field.formatOption.tableFlexParameter : '';
  }

  public isAddButtonDisabled(): boolean {

    if (this.isReadonly || !this?.metaInfo?.fields) {
      return false;
    }
    const missingApplyData = this.metaInfo.fields.some((field) => {
      const missingParentData = field.type === ControlType.referenceByParentData && !this.parentData?.[field.name];
      const missingHasExtraData = field.type === ControlType.referenceByExtraData && !this.extraDataService.getExtraData(field.name);
      return missingParentData || missingHasExtraData;
    });

    return missingApplyData;
  }

  public isDeleteButtonEnabled(): boolean {
    return this.metaInfo?.isDeletable;
  }

  private setupSort(): void {
    setTimeout(() => {
      const sortItems = this.metaTableInfo.fields.filter(controlItem => controlItem.isPreSortedItem);
      if (sortItems?.length > 1) {
        console.error(`Crud: Warning - more than one isPreSortedItem found for '${this.metaInfoSelector}'`);
      }
      let sortControl = this.metaTableInfo.fields.find(controlItem => controlItem.isPreSortedItem);
      if (!sortControl) {
        sortControl = this.metaTableInfo.fields.find((item: GenericFieldInfo) =>
          (item.type === ControlType.string || item.type === ControlType.number) && item.isTableColumn);

        if (!sortControl) {
          this.sort.disabled = true;
        }
      }
      if (sortControl && this.sort && this.dataSource) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.sort.active = sortControl.name;
        this.sort.direction = 'asc';
      }
    });
  }

  private setupFilter(): void {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filterDestination: string[] = [];

      this.metaTableInfo.fields.forEach((field) => {
        if (field.isTableColumn && (field.type === ControlType.string || field.type === ControlType.number)) {
          let fieldValue = data[field.name];
          if (field.type === ControlType.string) {
            fieldValue = fieldValue && fieldValue.toLowerCase();
          } else {
            fieldValue = fieldValue && fieldValue.toString();
          }
          if (fieldValue) {
            filterDestination.push(fieldValue);
          }
        }
      });

      return filterDestination.some((item) => item.startsWith(filter));
    };
  }
}
