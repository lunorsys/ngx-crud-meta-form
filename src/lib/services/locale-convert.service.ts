import { Inject, LOCALE_ID, Injectable } from '@angular/core';
import { getLocaleNumberSymbol, NumberSymbol } from '@angular/common';
import Globalize from 'globalize/dist/globalize';

@Injectable()
export class LocalConvertService {

  public static MOMENT_SHORT_DATE = 'l';
  public static MOMENT_SHORT_DATE_EXACT = 'L';
  public static MOMENT_SHORT_DATETIME = 'l, LT';
  public static MOMENT_SHORT_DATETIME_EXACT = 'L, LT';

  constructor(@Inject(LOCALE_ID) private locale: string) {
  }

  public getCurrencyDecimalSymbol(): string {
    return getLocaleNumberSymbol(this.locale, NumberSymbol.CurrencyDecimal);
  }

  public parseNumber(rawValue: string): number {
    if (!rawValue) {
      return null;
    }
    const value = Globalize.parseNumber(rawValue);
    if (isNaN(value) || !value) {
      return null;
    }
    return value;
  }

  public localSortFunction(name1: string, name2: string): number {
    return (name1.toLocaleLowerCase() < name2.toLocaleLowerCase() ? -1 : (name1.toLocaleLowerCase() > name2.toLocaleLowerCase() ? 1 : 0));
  }

  public formatCurrency(value: number): string {
    const options: Globalize.NumberFormatterOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    if (value != null && !isNaN(value)) {
      return Globalize.formatNumber(value, options);
    }

    return null;
  }
}
