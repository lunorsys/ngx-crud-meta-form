import { Injectable } from '@angular/core';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import {
  MessageDialogComponent, MessageDialogButtons, MessageDialogParameter
} from '../components/message-dialog/message-dialog.component';


@Injectable({ providedIn: 'root' })
export class MessageDialogService {

  constructor(private dialog: MatDialog) { }

  public showConfirmDialog(message: string): MatDialogRef<MessageDialogComponent, boolean> {

    const matConfig: MatDialogConfig = {
      data: {
        message,
        buttons: MessageDialogButtons.yesNo
      },
      disableClose: true,
      width: '400px',
    };

    return this.dialog.open<MessageDialogComponent, MessageDialogParameter, boolean>(MessageDialogComponent, matConfig);
  }

  public showInfoDialog(message: string): MatDialogRef<MessageDialogComponent, boolean> {
    const matConfig: MatDialogConfig = {
      data: {
        message,
        buttons: MessageDialogButtons.ok
      },
      disableClose: true,
      width: '400px',
    };

    return this.dialog.open<MessageDialogComponent, MessageDialogParameter, boolean>(MessageDialogComponent, matConfig);
  }
}
