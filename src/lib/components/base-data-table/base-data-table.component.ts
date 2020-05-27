import { Component, OnInit, OnDestroy, ViewChild, AfterContentChecked, ChangeDetectorRef } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { takeUntil, startWith, map } from 'rxjs/operators';
import { Subject, Observable, of, BehaviorSubject } from 'rxjs';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
//
import { CrudTableHeaderComponent } from '../crud-table-header/crud-table-header.component';
import { CrudTableComponent, } from '../crud-table/crud-table.component';
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

  private filterListData$ = new BehaviorSubject<any[]>(null);
  public metaInfoSelector: MetaInfoTag;
  private ngUnsubscribe = new Subject();

  constructor(private route: ActivatedRoute,
    private crudService: CrudService,
    private metaInfoService: MetaInfoService,
    private metaInfoBaseService: MetaInfoBaseService,
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

  private fillLookupListData(metaInfoSelector: MetaInfoTag) {
    const metaInfo = this.metaInfoService.getMetaInfoInstance(metaInfoSelector);
    if (metaInfo.fieldFilterInfo) {
      this.crudService.getTable(metaInfoSelector, this.metaInfo.fieldFilterInfo.restPath)
        .pipe(takeUntil(this.ngUnsubscribe)).subscribe(listData => {
          const fields = metaInfo.fields;
        }, err => {
          this.isLoadingResults = of(false);
        });
    }
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
      const autocompleteCtrl = this.form.get('autocomplete');
      if (autocompleteCtrl) {
        autocompleteCtrl.setValue('');
      }
      if (urlParts.length) {
        const restPath = urlParts[urlParts.length - 1].path || null;
        if (restPath) {
          this.metaInfoSelector = restPath;
          this.metaInfo = this.metaInfoService.getMetaInfoInstance(this.metaInfoSelector);
          if (this.metaInfo.fieldFilterInfo) {
            this.fillLookupListData(this.metaInfoSelector);
          }
          this.prepareFilter();
          this.prepareListData();
        } else {
          this.isLoadingResults = of(false);
        }
      }
    }, err => {
      this.isLoadingResults = of(false);
    });
  }

  private prepareListData() {
    this.isLoadingResults = of(true);
    this.listData = [];
    const restPath = this.metaInfoBaseService.extractRestPath(this.metaInfo, {});
    this.crudService.getTable(this.metaInfoSelector, restPath).pipe(takeUntil(this.ngUnsubscribe)).subscribe((listData) => {
      this.isLoadingResults = of(false);
      this.listData = listData;
    }, err => {
      console.log('error: ' + err);
      this.isLoadingResults = of(false);
    });
  }

  private prepareFilter() {
    this.fieldFilter = new GenericFieldInfo();
    if (this.metaInfo.fieldFilterInfo && this.metaInfo.fieldFilterInfo.fields && this.metaInfo.fieldFilterInfo.fields.length) {
      this.fieldFilter = this.metaInfo.fieldFilterInfo.fields[0];
      if (this.fieldFilter.lookup && this.filterListData$) {
        this.form.addControl(this.fieldFilter.name, new FormControl(''));
        this.autocompleteList = this.form.get('autocomplete').valueChanges
          .pipe(
            startWith(''),
            map(item => this.getAutocompleteList(item))
          );
      }
    }
  }

  public applyFilter(filterValue: string) {
    this.filter = filterValue;
  }

  public displayLookupInputValue(item: any) {
    return this.displayLookupListValue(this.fieldFilter, item);
  }

  public displayLookupListValue(field: GenericFieldInfo, item: any): string {
    if (!item || !field || !field.lookup || !field.lookup.getLookupValue) {
      return '';
    }
    return field.lookup.getLookupValue(item);
  }

  public getAutocompleteList(searchValue: string): any[] {
    if (searchValue) {
      if (typeof searchValue === 'string' && this.fieldFilter) {
        return this.filterListData$.value.filter(item => {
          const itemValue = this.fieldFilter.lookup.getLookupValue(item);
          return itemValue && itemValue.toLowerCase().startsWith(searchValue.toLowerCase());
        });
      }
    } else {
      if (this.fieldFilter.name) {
        this.metaInfoExtraDataService.setExtraData(this.fieldFilter.name, '');
      }
      return [];
    }
  }

  public autocompleteSelected(selected: MatAutocompleteSelectedEvent) {
    const extraData = selected && selected.option ? selected.option.value[this.fieldFilter.name] : '';
    this.metaInfoExtraDataService.setExtraData(this.fieldFilter.name, extraData);
    this.prepareListData();
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
    this.prepareListData();
  }

  public getReadonly() {
    return this.fieldFilter && this.fieldFilter.name && !this.metaInfoExtraDataService.getExtraData(this.fieldFilter.name);
  }

  public getListData() {
    return this.listData;
  }
}
