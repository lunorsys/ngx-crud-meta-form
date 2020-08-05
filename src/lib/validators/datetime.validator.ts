import { ValidatorFn, FormControl } from '@angular/forms';
import moment from 'moment';

export class DateTimeValidator {

  public static validate(): ValidatorFn {

    return (control: FormControl): { [key: string]: boolean } | null => {

      if (control.value) {
        const dateTime = moment(control.value);
        if (!moment(dateTime).isValid()) {
          return {
            datetime: true
          };
        }

        if (dateTime.isBefore(DateTimeValidator.getMinDate()) || dateTime.isAfter(DateTimeValidator.getMaxDate())) {
          return {
            datetime: true
          };
        }

        return null;
      }
    };
  }

  private static getMinDate(): Date {
    return new Date(2019, 1, 1);
  }

  private static getMaxDate(): Date {
    return new Date(new Date().setFullYear(new Date().getFullYear() + 10));
  }



}
