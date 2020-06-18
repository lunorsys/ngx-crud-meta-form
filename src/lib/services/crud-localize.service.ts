
import { Inject, LOCALE_ID, Injectable } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import moment from 'moment';
import Globalize from 'globalize/dist/globalize';
import 'globalize/number';
import { CULTURE_NAMES } from '@code-art/angular-globalize/schematics/cultures';

// https://www.npmjs.com/package/@code-art/angular-globalize/v/3.1.0

@Injectable({
  providedIn: 'root'
})
export class CrudLocalizeService {
  private nativeLanguage: string;

  constructor(@Inject(LOCALE_ID) private locale: string) {
    this.nativeLanguage = navigator.language;
  }

  public initializeGlobalizeLibrary(): () => Promise<any> {
    Globalize.load(require('cldr-data/supplemental/likelySubtags.json'));
    Globalize.load(require('cldr-data/supplemental/numberingSystems.json'));
    return (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const localeId = this.locale.split('-')[0];
        import(`@angular/common/locales/${localeId}.js`).then(module => {
          registerLocaleData(module.default);
          const dateTimeLanguage = this.getDatetimeLanguage();
          moment.locale(dateTimeLanguage);
        }, reject).then(() => {
          const numberLanguage = this.getNumberLanguage();
          import(`cldr-data/main/${numberLanguage}/numbers.json`).then((languageModule) => {
            Globalize.load(languageModule.default);
            Globalize.locale(numberLanguage);
          });
        }, reject);
        resolve();
      });
    };
  }

  public getBrowserLanguage(): string {
    return this.nativeLanguage;
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

  private getDatetimeLanguage(): string {
    let dateTimeLanguage = this.nativeLanguage;
    if (['en-IN'].includes(dateTimeLanguage)) {
      dateTimeLanguage = 'en-GB';
    }
    // ==> actual it doesn't work
    // const languages: string[] = moment.locales();
    // if (!languages.includes(dateTimeLanguage)) {
    //   dateTimeLanguage = 'de';
    // }
    return dateTimeLanguage;
  }

  // https://www.alanet.org/docs/default-source/default-document-library/cm01_international_etiquette.pdf?sfvrsn=ad954bab_0
  // https://travel.stackexchange.com/questions/34950/which-large-countries-use-12-hour-time-format-am-pm

  public hasAmPmSupport(): boolean {
    return ['en-GB', 'en-IN', 'ca'].includes(this.locale);
  }
}
