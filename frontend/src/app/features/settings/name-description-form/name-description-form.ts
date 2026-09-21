import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NameDescriptionRequest } from '../../../core/models/catalog.model';

export interface NameDescriptionFormData {
  title: string;
  item: { name: string; description: string | null } | null;
}

/** Diálogo genérico reutilizado por Categorías y Marcas (misma forma: nombre + descripción). */
@Component({
  selector: 'app-name-description-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './name-description-form.html',
  styleUrl: './name-description-form.scss',
})
export class NameDescriptionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<NameDescriptionFormComponent>);
  readonly data = inject<NameDescriptionFormData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    name: [this.data.item?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    description: [this.data.item?.description ?? '', Validators.maxLength(255)],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: NameDescriptionRequest = { name: v.name!, description: v.description || null };
    this.dialogRef.close(request);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
