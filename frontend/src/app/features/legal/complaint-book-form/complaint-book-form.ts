import { Component, OnInit, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Complaint, ComplaintSubmission, ComplaintType } from '../../../core/models/complaint.model';
import { ComplaintService } from '../../../core/services/complaint.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';

/**
 * Libro de Reclamaciones Virtual — página legal pública, sin login (Fase 43,
 * obligatoria por ley para toda tienda online en Perú: Ley 29571 + D.S.
 * 011-2011-PCM). Vive en su propia ruta de nivel superior (`/libro-de-reclamaciones`,
 * ver app.routes.ts), igual criterio que privacy-policy: debe ser accesible
 * desde el catálogo Y el portal sin depender de ninguno de los dos layouts, y
 * `/catalogo/:id` captura cualquier segmento como id de producto (Fase 18) —
 * anidarla ahí habría chocado con esa ruta comodín.
 */
@Component({
  selector: 'app-complaint-book-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './complaint-book-form.html',
  styleUrl: './complaint-book-form.scss',
})
export class ComplaintBookForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly location = inject(Location);
  private readonly complaintService = inject(ComplaintService);
  private readonly catalogService = inject(PublicCatalogService);

  readonly storeName = signal('RamichanStore');
  readonly saving = signal(false);
  readonly submitted = signal<Complaint | null>(null);

  readonly documentTypeOptions = ['DNI', 'Carné de Extranjería', 'Pasaporte'];

  readonly form = this.fb.group({
    type: ['RECLAMO' as ComplaintType, Validators.required],
    consumerFullName: ['', [Validators.required, Validators.maxLength(200)]],
    consumerDocumentType: ['DNI', Validators.required],
    consumerDocumentNumber: ['', [Validators.required, Validators.maxLength(20)]],
    consumerAddress: ['', [Validators.required, Validators.maxLength(255)]],
    consumerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    consumerPhone: ['', [Validators.required, Validators.maxLength(30)]],
    isMinor: [false],
    guardianFullName: ['', Validators.maxLength(200)],
    guardianDocumentNumber: ['', Validators.maxLength(20)],
    goodDescription: ['', [Validators.required, Validators.maxLength(500)]],
    claimedAmount: [null as number | null, Validators.min(0)],
    detail: ['', Validators.required],
    consumerRequest: ['', Validators.required],
  });

  ngOnInit(): void {
    this.catalogService.getStoreInfo().subscribe({
      next: (res) => this.storeName.set(res.data.storeName || 'RamichanStore'),
      error: () => {},
    });
    this.form.controls.isMinor.valueChanges.subscribe((isMinor) => this.applyGuardianValidators(!!isMinor));
  }

  private applyGuardianValidators(isMinor: boolean): void {
    const name = this.form.controls.guardianFullName;
    const doc = this.form.controls.guardianDocumentNumber;
    name.setValidators(isMinor ? [Validators.required, Validators.maxLength(200)] : [Validators.maxLength(200)]);
    doc.setValidators(isMinor ? [Validators.required, Validators.maxLength(20)] : [Validators.maxLength(20)]);
    name.updateValueAndValidity({ emitEvent: false });
    doc.updateValueAndValidity({ emitEvent: false });
  }

  goBack(): void {
    this.location.back();
  }

  print(): void {
    window.print();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const request: ComplaintSubmission = {
      type: v.type as ComplaintType,
      consumerFullName: v.consumerFullName!,
      consumerDocumentType: v.consumerDocumentType!,
      consumerDocumentNumber: v.consumerDocumentNumber!,
      consumerAddress: v.consumerAddress!,
      consumerEmail: v.consumerEmail!,
      consumerPhone: v.consumerPhone!,
      isMinor: !!v.isMinor,
      guardianFullName: v.guardianFullName || null,
      guardianDocumentNumber: v.guardianDocumentNumber || null,
      goodDescription: v.goodDescription!,
      claimedAmount: v.claimedAmount ?? null,
      detail: v.detail!,
      consumerRequest: v.consumerRequest!,
    };
    this.saving.set(true);
    this.complaintService.submit(request).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.submitted.set(res.data);
      },
      error: () => this.saving.set(false),
    });
  }
}
