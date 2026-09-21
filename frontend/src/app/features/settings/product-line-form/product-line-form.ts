import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Brand } from '../../../core/models/catalog.model';
import { ProductLine, ProductLineRequest } from '../../../core/models/catalog.model';

export interface ProductLineFormData {
  line: ProductLine | null;
  brands: Brand[];
}

@Component({
  selector: 'app-product-line-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './product-line-form.html',
  styleUrl: './product-line-form.scss',
})
export class ProductLineFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProductLineFormComponent>);
  readonly data = inject<ProductLineFormData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    name: [this.data.line?.name ?? '', [Validators.required, Validators.maxLength(100)]],
    brandId: [this.data.line?.brandId ?? null],
    description: [this.data.line?.description ?? '', Validators.maxLength(255)],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: ProductLineRequest = { name: v.name!, brandId: v.brandId, description: v.description || null };
    this.dialogRef.close(request);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
