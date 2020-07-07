import { Component, OnInit, OnDestroy, ViewChild, AfterContentChecked, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject, Observable, of } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
//
import { CrudTableHeaderComponent } from '../crud-table-header/crud-table-header.component';
import { MetaInfo, GenericFieldInfo, ControlType, MetaInfoTag, _MetaInfoTag } from '../../meta-info/meta-info.model';
import { CrudService } from '../../services/crud.service';
import { MetaInfoService } from '../../services/meta-info.service';
import { MetaInfoBaseService } from '../../services/meta-info-base.service';
import { MetaInfoExtraDataService } from '../../services/meta-info-extra-data.service';
import { CrudTableResult } from '../../models/crud.model';

@Component({
  selector: 'ngx-base-data-table',
  templateUrl: './base-data-table.component.html',
  styleUrls: ['./base-data-table.component.scss']
})

export class BaseDataTableComponent implements OnInit, OnDestroy, AfterContentChecked {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(CrudTableHeaderComponent) tableHeader: CrudTableHeaderComponent;

  public metaInfo: MetaInfo;
  public pageLimit = [100, 200, 500];
  public listData = [];
  public isLoadingResults: Observable<boolean>;
  public filter: string;
  public fieldFilter: GenericFieldInfo;
  public form: FormGroup;
  public autocompleteList = new Observable<any[]>();
  public ControlType = ControlType;

  public metaInfoSelector: MetaInfoTag;
  private ngUnsubscribe = new Subject();

  constructor(private route: ActivatedRoute,
    private crudService: CrudService,
    private metaInfoService: MetaInfoService,
    private fb: FormBuilder,
    private cdref: ChangeDetectorRef,
    private metaInfoExtraDataService: MetaInfoExtraDataService) {
    this.metaInfoSelector = _MetaInfoTag.Undefined;
  }

  ngOnInit() {
    this.form = this.fb.group({
      autocomplete: [],
    });
    this.initDataLoading();
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private initDataLoading() {
    this.route.url.pipe(takeUntil(this.ngUnsubscribe)).subscribe(urlParts => {
      if (this.tableHeader) {
        this.tableHeader.clearFilterValue();
      }
      this.isLoadingResults = of(true);
      this.listData = [];

      if (urlParts.length) {
        const metaInfoSelector = urlParts[urlParts.length - 1].path || null;
        if (metaInfoSelector) {
          this.metaInfoSelector = metaInfoSelector;
          this.metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
          this.prepareListData(metaInfoSelector);
        } else {
          this.isLoadingResults = of(false);
        }
      }
    }, err => {
      this.isLoadingResults = of(false);
    });
  }

  private prepareListData(metaInfoSelector: MetaInfoTag) {
    this.isLoadingResults = of(true);
    this.listData = [];
    this.crudService.getTable(metaInfoSelector).pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
      this.isLoadingResults = of(false);
      this.listData = listData;
    }, err => {
      console.log('error: ' + err);
      this.isLoadingResults = of(false);
    });
  }

  public applyFilter(filterValue: string) {
    this.filter = filterValue;
  }

  public displayLookupInputValue(item: any) {
    return this.displayLookupListValue(this.fieldFilter, item);
  }

  public displayLookupListValue(field: GenericFieldInfo, item: any): string {
    return (item && field?.lookup?.getLookupValue(item)) || '';
  }

  public hasFilterValue() {
    return this.form.get('autocomplete').value;
  }

  public clearFilterValue(field: GenericFieldInfo) {
    if (this.fieldFilter.name) {
      this.metaInfoExtraDataService.setExtraData(this.fieldFilter.name, '');
      this.form.get('autocomplete').setValue('');
    }
  }

  public onRefreshTableData(tableData: CrudTableResult) {
    this.prepareListData(this.metaInfoSelector);
  }

  public getReadonly() {
    return this.fieldFilter && this.fieldFilter.name && !this.metaInfoExtraDataService.getExtraData(this.fieldFilter.name);
  }

  public getListData() {
    return this.listData;
  }
}
