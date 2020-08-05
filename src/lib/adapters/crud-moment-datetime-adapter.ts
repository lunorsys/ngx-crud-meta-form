import moment from 'moment';
import { NgxMatNativeDateAdapter, NgxMatDateFormats } from '@angular-material-components/datetime-picker';
import { Inject, LOCALE_ID } from '@angular/core';
import { Platform } from '@angular/cdk/platform';
import { CrudConfig } from '../models/crud-config';

export const CRUD_MOMENT_DATETIME_FORMATS: NgxMatDateFormats = {
  parse: {
    dateInput: 'l, LTS'
  },
  display: {
    dateInput: 'l, LTS',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

export class CrudDatetimeAdapter extends NgxMatNativeDateAdapter {

  private formatPattern: string;

  constructor(@Inject(LOCALE_ID) public locale: string,
    private platForm: Platform,
    private crudConfig: CrudConfig) {

    super(locale, platForm);
    const hasAmPmSupport = this.crudConfig.hasAmPmSupport;
    this.formatPattern = hasAmPmSupport ? 'L, hh:mm A' : 'L, HH:mm';
  }

  format(date: Date): string {
    return moment(date).format(this.formatPattern);
  }

  parse(value: any): Date | null {
    if (!moment(value, this.formatPattern, false).isValid()) {
      return this.invalid();
    }
    return moment(value, this.formatPattern, false).toDate();
  }
}
