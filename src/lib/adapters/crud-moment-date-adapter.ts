import moment, { Moment } from 'moment';
import { NgxMatDateFormats } from '@angular-material-components/datetime-picker';
import { Inject, LOCALE_ID } from '@angular/core';
import { MomentDateAdapter, MatMomentDateAdapterOptions } from '@angular/material-moment-adapter';
import { LocalConvertService } from '../services/locale-convert.service';

export const CUSTOM_MOMENT_DATE_FORMATS: NgxMatDateFormats = {
  parse: {
    dateInput: LocalConvertService.MOMENT_SHORT_DATE
  },
  display: {
    dateInput: LocalConvertService.MOMENT_SHORT_DATE,
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

export class CrudMomentDateAdapterOptions implements MatMomentDateAdapterOptions {
  public strict = false;
  public useUtc = true;
}

export class CrudDateAdapter extends MomentDateAdapter {

  constructor(@Inject(LOCALE_ID) public locale: string) {
    super(locale, new CrudMomentDateAdapterOptions());
  }

  format(date: Moment, displayFormat: string): string {
    return moment(date).format(displayFormat);
  }

  parse(value: any): Moment | null {
    const utcTime = moment(value, LocalConvertService.MOMENT_SHORT_DATE, false).utc(true);
    if (!utcTime.isValid()) {
      return this.invalid();
    }
    return moment(utcTime, LocalConvertService.MOMENT_SHORT_DATE, false);
  }
}
