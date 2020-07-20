import { ScrollMode } from './../../models/crud.model';
import { Component, OnInit, OnDestroy, ViewChild, AfterContentChecked, ChangeDetectorRef, HostBinding } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject, Observable, of } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
//
import { CrudTableHeaderComponent } from '../crud-table-header/crud-table-header.component';
import { MetaInfo, GenericFieldInfo, ControlType, MetaInfoTag, _MetaInfoTag } from '../../meta-info/meta-info.model';
import { CrudService } from '../../services/crud.service';
import { CrudObjectsService } from '../../services/crud-objects.service';
import { CrudTableResult } from '../../models/crud.model';
import { CrudConfig } from '../../models/crud-config';
import { MetaInfoService } from '../../services/meta-info.service';

@Component({
  selector: 'ngx-base-data-table',
  templateUrl: './base-data-table.component.html',
  styleUrls: ['./base-data-table.component.scss']
})

export class BaseDataTableComponent implements OnInit, OnDestroy, AfterContentChecked {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(CrudTableHeaderComponent) tableHeader: CrudTableHeaderComponent;
  @HostBinding('class.scroll-mode-table') scrollModeTableEnabled = false;
  @HostBinding('class.scroll-mode-content') scrollModeContentEnabled = false;

  public metaInfo: MetaInfo;
  public pageLimit = [100, 200, 500];
  public listData = [];
  public isLoadingResults: Observable<boolean>;
  public filter: string;
  public form: FormGroup;
  public autocompleteList = new Observable<any[]>();
  public ControlType = ControlType;

  public metaInfoSelector: MetaInfoTag;
  private ngUnsubscribe = new Subject();

  constructor(private route: ActivatedRoute,
    private crudService: CrudService,
    private crudObjectsService: CrudObjectsService,
    private fb: FormBuilder,
    private cdref: ChangeDetectorRef,
    private crudConfig: CrudConfig,
    private metaInfoService: MetaInfoService) {

    this.metaInfoSelector = _MetaInfoTag.Undefined;
    this.scrollModeTableEnabled = this.crudConfig?.scrollModeBaseDataTable === ScrollMode.Table || false;
    this.scrollModeContentEnabled = this.crudConfig?.scrollModeBaseDataTable === ScrollMode.Content || false;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      autocomplete: [],
    });
    this.initDataLoading();
  }

  ngAfterContentChecked(): void {
    this.cdref.detectChanges();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  private initDataLoading(): void {
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
    }, () => {
      this.isLoadingResults = of(false);
    });
  }

  private prepareListData(metaInfoSelector: MetaInfoTag): void {
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

  public applyFilter(filterValue: string): void {
    this.filter = filterValue;
  }

  public displayLookupListValue(field: GenericFieldInfo, item: any): string {
    return (item && field?.lookup?.getLookupValue(item, [])) || '';
  }

  public onRefreshTableData(tableData: CrudTableResult): void {
    this.prepareListData(this.metaInfoSelector);
  }

  public getListData(): any[] {
    return this.listData;
  }
}
