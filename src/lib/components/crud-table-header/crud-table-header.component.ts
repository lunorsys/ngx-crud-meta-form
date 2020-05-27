import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ngx-crud-table-header',
  templateUrl: './crud-table-header.component.html',
  styleUrls: ['./crud-table-header.component.scss']
})
export class CrudTableHeaderComponent implements OnInit {

  constructor() {
    this.hasContent = true;
    this.showSearch = false;
  }
  @Input() title: string;
  @Input() subtitle: string;
  @Input() hasContent: boolean;
  @Output() applyFilter = new EventEmitter<string>();
  filterValue = '';
  showSearch: boolean;

  ngOnInit() {
    if (this.applyFilter.observers.length > 0) {
      this.showSearch = true;
    }
  }

  onApplyFilter() {
    this.applyFilter.next(this.filterValue ? this.filterValue.toLowerCase().trim() : '');
  }

  hasFilterValue() {
    return this.filterValue.length;
  }

  clearFilterValue() {
    this.applyFilter.next('');
    this.filterValue = '';
  }
}
