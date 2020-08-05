import { AbstractControl, ValidatorFn } from '@angular/forms';
import { Injector } from '@angular/core';
import * as Globalize from 'globalize/dist/globalize';
import { LocalConvertService } from '../services/locale-convert.service';

export class NumberValidator {

  static angularInjector: Injector = null;

  public static validateNumber(minFractionDigits: number = 0, maxFractionDigits: number = 0): ValidatorFn {

    return validatorFn(minFractionDigits, maxFractionDigits);
  }

  public static validateFraction(numberString: string, minFractionDigits: number, maxFractionDigits: number,
    localeNumberSymbol: string): boolean {
    const valueArr = numberString.split(localeNumberSymbol);

    switch (valueArr.length) {
      case 2:
        const fractionLength = valueArr[1].length;
        return fractionLength >= minFractionDigits && fractionLength <= maxFractionDigits;
      case 1:
        return minFractionDigits === 0;
      default:
        return false;
    }
  }
}

export function validatorFn(minFractionDigits: number, maxFractionDigits: number) {
  const validatorInnerFn = (control: AbstractControl): { [key: string]: boolean } | null => {
    const localSetupService: LocalConvertService = NumberValidator.angularInjector.get(LocalConvertService);
    const localeNumberSymbol = localSetupService.getCurrencyDecimalSymbol();

    if (control.value) {
      const parser = Globalize.numberParser();
      const numberString = control.value;
      const numberValue = parser(numberString);
      if (isNaN(numberValue)) {
        return {
          number: true
        };
      }

      if (!NumberValidator.validateFraction(numberString, minFractionDigits, maxFractionDigits, localeNumberSymbol)) {
        return {
          number: true
        };
      }
      return null;
    }
  };
  return validatorInnerFn;
}
