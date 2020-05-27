import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Injectable, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export class SnackBarParameter {
  public message: string;
  public type: SnackBarType;
  public action?: boolean;
  public duration?: number;
}

export enum SnackBarType {
  warn = 'warn',
  info = 'info',
  success = 'success',
}

class SnackBarData {
  public message: string;
  public action: string;
  public config: MatSnackBarConfig;
}

@Injectable({
  providedIn: 'root'
})
export class SnackBarService implements OnDestroy {

  private ngUnsubscribe = new Subject();
  private snackBars: SnackBarData[];

  constructor(
    public snackBar: MatSnackBar,
  ) {
    this.snackBars = [];
  }

  ngOnDestroy() {
    this.ngUnsubscribe.unsubscribe();
  }

  public openSnackbar(snackBarParameter: SnackBarParameter): void {
    this.buildSnackBar(snackBarParameter);

    this.displaySnackBar();
  }

  public openSnackbars(snackBarParameters: SnackBarParameter[]): void {
    snackBarParameters.forEach((snackBarParameter) => {
      this.buildSnackBar(snackBarParameter);
    });

    this.displaySnackBar();
  }

  private buildSnackBar(snackBarParameter: SnackBarParameter) {
    const { message, duration, type } = snackBarParameter;
    const action = snackBarParameter.action === false ? null : 'Ok';
    const config = new MatSnackBarConfig;

    config.duration = duration || 6000;
    config.panelClass = type;

    const snackBarData: SnackBarData = {
      message: message,
      action: action,
      config: config
    };

    this.snackBars.push(snackBarData);
  }

  private displaySnackBar(): void {
    if (this.snackBars.length === 0) {
      return;
    }

    const { message, action, config } = this.snackBars.shift();

    this.snackBar.open(message, action, config).afterDismissed().pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.displaySnackBar();
      });
  }
}
