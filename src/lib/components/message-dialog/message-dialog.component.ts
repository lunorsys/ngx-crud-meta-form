import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export class MessageDialogParameter {
  public message: string;
  public buttons: MessageDialogButtons;
}

export enum MessageDialogButtons {
  deleteCancel = 'deleteCancel',
  yesNo = 'yesNo',
  ok = 'ok'
}

@Component({
  selector: 'ngx-message-dialog',
  templateUrl: './message-dialog.component.html',
  styleUrls: ['./message-dialog.component.scss']
})
export class MessageDialogComponent {
  public message: string;
  public buttons: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parameter: MessageDialogParameter,
    public dialogRef: MatDialogRef<MessageDialogComponent, boolean>
  ) {
    this.message = parameter.message;
    this.buttons = parameter.buttons;
  }

  onConfirm(): void {
    // Close the dialog, return true
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }
}
