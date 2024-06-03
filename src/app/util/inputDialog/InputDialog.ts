import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Component, Inject} from '@angular/core';

@Component({
  selector: 'input-dialog',
  templateUrl: './input-dialog.html',
})
export class InputDialog {
  title;
  input;
  type;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<InputDialog>
  ) {
  }

  ngOnInit() {
    this.title = this.data.title
    this.type = this.data.type
  }
  onNoClick(): void {
    this.dialogRef.close({
      input: null
    });
  }

  confirm() {
    this.dialogRef.close({
      input: this.input
    });
  }
}
