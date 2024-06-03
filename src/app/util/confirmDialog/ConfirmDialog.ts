import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Component, Inject} from '@angular/core';

@Component({
  selector: 'confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  title;
  text;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ConfirmDialog>
  ) {
  }

  ngOnInit() {
    this.title = this.data.title
    this.text = this.data.text
  }
  onNoClick(): void {
    this.dialogRef.close({
      confirmed: false
    });
  }

  confirm() {
    this.dialogRef.close({
      confirmed: true
    });
  }
}
