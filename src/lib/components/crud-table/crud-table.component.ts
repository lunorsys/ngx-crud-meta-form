import {
  Component, OnInit, ViewChild, Input, OnDestroy, Output, EventEmitter, ChangeDetectorRef,
  Inject,
  AfterContentChecked,
} from '@angular/core';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';
import Globalize from 'globalize/dist/globalize';
//
import { MetaInfo, MetaInfoTag, GenericFieldInfo, ControlType, _MetaInfoTag } from '../../meta-info/meta-info.model';
import { CrudTableResult, CrudFormParameter } from '../../models/crud.model';
import { CrudObjectsService } from '../../services/crud-objects.service';
import { CrudService } from '../../services/crud.service';
import { SnackBarService, SnackBarParameter, SnackBarType } from '../../services/snack-bar.service';
import { CrudFormComponent, CrudFormResult } from '../crud-form/crud-form.component';
import { CACHE_TOKEN, ICacheService } from '../../interfaces/icache.service';
import { MetaInfoService } from '../../services/meta-info.service';
import moment from 'moment';
import { LocalConvertService } from '../../services/locale-convert.service';

@Component({
  selector: 'ngx-crud-table',
  templateUrl: './crud-table.component.html',
  styleUrls: ['./crud-table.component.scss']
})
export class CrudTableComponent implements OnInit, OnDestroy, AfterContentChecked { // AfterViewInit

  @Input() paginator: MatPaginator = null;
  @Input() field: GenericFieldInfo;
  @Input() parentMetaInfoSelector: MetaInfoTag = _MetaInfoTag.Undefined;
  @ViewChild(MatTable) table: MatTable<any>;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatAutocomplete) autocomplete: MatAutocomplete;
  @Output() refreshTableData = new EventEmitter<CrudTableResult>();

  @Input() set listData(listData: any[]) {
    this._listData = [];
    if (this.init && listData && listData.length > 0) {
      this._listData = cloneDeep(listData);
      this.dataSource.data = this._listData;
      this.dataSource.paginator = this.paginator;
    } else {
      this.dataSource.data = [];
    }
    // this.changeDetection.markForCheck();
  }
  get listData(): any[] {
    return this._listData;
  }

  @Input() set metaInfoSelector(metaInfoSelector: MetaInfoTag) {

    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
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
  get metaInfoSelector(): string {
    return this._metaInfoSelector;
  }

  @Input() set isReadonly(isReadonly: boolean) {
    this._isReadonly = isReadonly;
  }
  get isReadonly(): boolean {
    return this._isReadonly;
  }

  @Input() set filter(filter: string) {
    if (this.init) {
      this._filter = filter;
      this.dataSource.filter = filter;
    }
  }
  get filter(): string {
    return this._filter;
  }

  @Input() set parentData(parentData: any) {
    this._parentData = parentData;
    // this.changeDetection.markForCheck();
  }
  get parentData() {
    return this._parentData;
  }

  public displayedColumns: string[];
  public isLoadingResults = true;
  public dataSource = new MatTableDataSource<any>();
  // public dataready: Observable<boolean> = of(false);
  public dataready = false;
  public metaTableInfo: MetaInfo;
  public metaInfo: MetaInfo;
  ControlType = ControlType;

  private numberFormatter: (value: number) => string;
  private init = true;
  private _listData = [];
  private _isReadonly: boolean;
  private _metaInfoSelector: MetaInfoTag;
  private _filter: string;
  private _parentData: any = {};

  private ngUnsubscribe = new Subject();

  constructor(private dialog: MatDialog,
    @Inject(CACHE_TOKEN) private cacheService: ICacheService,
    private crudService: CrudService,
    private changeDetection: ChangeDetectorRef,
    private crudObjectsService: CrudObjectsService,
    private snackBarService: SnackBarService,
    private metaInfoService: MetaInfoService) {

    this.metaTableInfo = new MetaInfo();
    this.metaInfo = new MetaInfo();
    this.dataSource.data = [];
    this.listData = [];
  }

  ngOnInit(): void {
    this.numberFormatter = Globalize.numberFormatter();
    this.dataSource.filter = this.filter;
    this.cacheService.isCacheAvailable.pipe(takeUntil(this.ngUnsubscribe)).subscribe((isAvailable) => {
      if (isAvailable) {
        this.setupSort();
        this.setupFilter();
        this.setupSortingDataAccessor();
        this.dataready = true;
      }
    });
  }

  ngAfterContentChecked(): void {
    this.changeDetection.detectChanges();
  }

  // ngAfterViewInit(): void {
  //   // this.changeDetection.detectChanges();
  //   setTimeout(() => {
  //     this.dataready = true;
  //   });
  // }

  ngOnDestroy(): void {
    this.dataSource.disconnect();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private setupSortingDataAccessor(): void {
    this.dataSource.sortingDataAccessor = (data: any[], sortHeaderId: string): string | number => {
      if (!this.metaTableInfo || !this.metaTableInfo.fields) {
        return null;
      }
      const sortField = this.metaTableInfo.fields.find((controlItem) => sortHeaderId === controlItem.name);
      if (!sortField) {
        return null;
      }
      let value: any;

      if (this.metaInfoService.isFieldForLookup(sortField)) {
        if (sortField.lookup) {
          const lookupKeyMetaInfo = this.metaInfoService.getMetaInfoInstance(sortField.lookup.metaInfoSelector);
          if (lookupKeyMetaInfo) {
            let lookupValuePreSortedItem = lookupKeyMetaInfo.fields.find((item: GenericFieldInfo) => item.isPreSortedItem);
            if (!lookupValuePreSortedItem) {
              lookupValuePreSortedItem = lookupKeyMetaInfo.fields.find((item: GenericFieldInfo) =>
                (item.type === ControlType.Number || item.type === ControlType.String) && item.isTableColumn);
              if (!lookupValuePreSortedItem) {
                this.sort = null;
              }
            }
            const lookupKey = data[sortHeaderId];
            if (lookupKey && lookupValuePreSortedItem) {
              const listData = this.cacheService.getCachedTable(sortField.lookup.metaInfoSelector);
              const lookupValue = listData.find((lookupItem) => lookupItem[sortHeaderId] === lookupKey);
              value = lookupValue && lookupValue[lookupValuePreSortedItem.name];
              value = (value as string)?.toLowerCase();
            }
          }
        } else {
          value = data?.length > 0 && sortHeaderId && data[sortHeaderId];
        }
      } else {
        switch (sortField.type) {
          case ControlType.String:
            value = (data[sortHeaderId] as string)?.toLowerCase();
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

  public getFieldValue(data: any, field: GenericFieldInfo): any {
    const value = data[field.name];
    if (!value && field.type !== ControlType.Number ||
      value === null ||
      field.type === ControlType.Number && isNaN(value)) {
      return '';
    }

    let result = null;
    let numberValue: number;
    switch (field.type) {

      case ControlType.Number:
        if (typeof value === 'string') {
          numberValue = Number(value);
        } else {
          numberValue = value;
        }
        result = this.numberFormatter(numberValue);
        break;

      case ControlType.Select:
      case ControlType.SelectAutocomplete:
        result = this.crudObjectsService.getLookupValueById(field, value);
        break;

      case ControlType.Date:
        // Work arround to keep the utc time
        const date = moment(value);
        result = date.subtract(date.utcOffset(), 'minutes').format(LocalConvertService.MOMENT_SHORT_DATE_EXACT);
        break;

      case ControlType.Datetime:
        // Work arround to keep the utc time
        const datetime = moment(value);
        result = datetime.subtract(datetime.utcOffset(), 'minutes').format(LocalConvertService.MOMENT_SHORT_DATETIME_EXACT);
        break;

      default:
        result = value;
        break;
    }

    return result;
  }

  public updateEntry(data: any): void {
    this.editEntry(data, this.parentData);
  }

  public createEntry(): void {
    this.editEntry(null, this.parentData);
  }

  private editEntry(data: any, parentData: any): void {
    if (!this.metaInfo.restPath) {
      console.error(`Crud: missing rest path in '${this.metaInfoSelector}'`);
      return;
    }

    if (data) {
      this.crudService.get(this.parentMetaInfoSelector, this.metaInfoSelector, data, parentData)
        .pipe(takeUntil(this.ngUnsubscribe)).subscribe((childData) => {
          const dialogRef = this.openCrudForm(childData);
          this.afterCloseCrudForm(dialogRef, data);
        }, err => {
          console.log('error: ' + err);
        });
    } else {
      const dialogRef = this.openCrudForm(null);
      this.afterCloseCrudForm(dialogRef, null);
    }
  }

  public deleteEntry(data: any): void {
    this.crudService.delete(this.parentMetaInfoSelector, this.metaInfoSelector, data, this.parentData)
      .pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
        this.updateAfterDelete(data);
      }, error => {
        const dialogParameter: SnackBarParameter = {
          message: `Error while delete: ${error} `,
          type: SnackBarType.warn
        };

        this.snackBarService.openSnackbar(dialogParameter);
      });
  }

  private updateAfterDelete(data: any): any[] {
    const filteredData = this.dataSource.data.filter((item) => data !== item);
    this.listData = filteredData;
    if (this.field) {
      this.refreshTableData.next({
        data: filteredData,
        field: this.field
      } as CrudTableResult);
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
        this.refreshTableData.next({
          data: this.dataSource.data,
          field: this.field
        });

        this.isLoadingResults = true;
      }
      // this.changeDetection.markForCheck();
    });
  }

  private openCrudForm(data: any): MatDialogRef<CrudFormComponent, CrudFormResult> {
    const matConfig: MatDialogConfig = {
      data: {
        data,
        metaInfoSelector: this.metaInfoSelector,
        parentData: this.parentData,
        parentMetaInfoSelector: this.parentMetaInfoSelector,
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
    return field?.formatOption?.tableFlexParameter || '';
  }

  public isAddButtonDisabled(): boolean {

    if (this.isReadonly || !this?.metaInfo?.fields) {
      return false;
    }
    const isAddButtonDisabled = this.metaInfo.fields.some((field) => {
      let isDisabled = false;
      if (field.type === ControlType.ReferenceByParentData) {
        const parentKeyName = field.parentKeyName || field.name;
        isDisabled = !this.parentData?.[parentKeyName];
      }
      return isDisabled;
    });

    return !!isAddButtonDisabled;
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
          (item.type === ControlType.String || item.type === ControlType.Number) && item.isTableColumn);

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
        if (field.isTableColumn && [ControlType.String, ControlType.Number].includes(field.type)) {
          let fieldValue = data[field.name];
          if (field.type === ControlType.String) {
            fieldValue = fieldValue?.toLowerCase();
          } else {
            fieldValue = fieldValue?.toString();
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
