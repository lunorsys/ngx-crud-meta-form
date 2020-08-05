import { Inject, LOCALE_ID, Injectable } from '@angular/core';
import { CULTURE_NAMES } from '@code-art/angular-globalize/schematics/cultures';

// https://www.npmjs.com/package/@code-art/angular-globalize/v/3.1.0

@Injectable({
  providedIn: 'root'
})
export class LocalizeService {

  private nativeLanguage: string;

  constructor(@Inject(LOCALE_ID) private locale: string) {
    this.nativeLanguage = navigator.language;
  }

  public static getBrowserLanguage(): string {
    return navigator.language;
  }

  public getNumberLanguage(): string {
    const localeIdArr = this.nativeLanguage.split('-');
    const localeId = localeIdArr.length > 1 ? `${localeIdArr[0]}-${localeIdArr[1]}` : localeIdArr[0];

    if (!CULTURE_NAMES.includes(this.nativeLanguage)) {
      return CULTURE_NAMES.find((locale) => locale.startsWith(localeId)) || 'de';
    } else {
      return this.nativeLanguage;
    }
  }

  public getDatetimeLanguage(): string {
    let dateTimeLanguage = this.nativeLanguage;
    if (['en-IN'].includes(dateTimeLanguage)) {
      dateTimeLanguage = 'en-GB';
    }
    // const languages: string[] = moment.locales();
    // if (!languages.includes(dateTimeLanguage)) {
    //   dateTimeLanguage = 'de';
    // }
    return dateTimeLanguage;
  }

  public getBrowserLanguage(): string {
    return LocalizeService.getBrowserLanguage();
  }

  // https://www.alanet.org/docs/default-source/default-document-library/cm01_international_etiquette.pdf?sfvrsn=ad954bab_0
  // https://travel.stackexchange.com/questions/34950/which-large-countries-use-12-hour-time-format-am-pm

  public hasAmPmSupport(): boolean {
    return ['en-GB', 'en-IN', 'ca'].includes(this.locale);
  }
}
