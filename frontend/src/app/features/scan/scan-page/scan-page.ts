import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { PRODUCT_STATUS_LABELS, Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { MovementFormComponent, MovementFormData } from '../../inventory/movement-form/movement-form';
import { ProductFormComponent, ProductFormData } from '../../products/product-form/product-form';

/**
 * Pantalla de escaneo standalone (Fase 44), pensada para abrirse desde el celular —
 * a diferencia del resto del admin (Fase 21: 100% de escritorio a propósito), esta
 * SÍ es mobile-first: cámara a pantalla completa, sin sidebar, un producto a la vez.
 * Reutiliza el mismo endpoint de lookup (código de fábrica o SKU propio) que
 * BarcodeScannerDialog, pero la cámara vive embebida en la página en vez de en un
 * diálogo — abrir el admin completo en un navegador de teléfono para llegar a un
 * diálogo dentro de otro diálogo no era una buena experiencia.
 */
@Component({
  selector: 'app-scan-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, MatDialogModule],
  templateUrl: './scan-page.html',
  styleUrl: './scan-page.scss',
})
export class ScanPage implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  @ViewChild('video', { static: true }) private readonly videoRef!: ElementRef<HTMLVideoElement>;

  private readonly reader = new BrowserMultiFormatReader();
  private controls: IScannerControls | null = null;

  readonly resolveImageUrl = resolveImageUrl;
  readonly statusLabels = PRODUCT_STATUS_LABELS;

  readonly starting = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly notFoundCode = signal<string | null>(null);
  readonly product = signal<Product | null>(null);
  readonly looking = signal(false);

  ngOnInit(): void {
    this.startCamera();
  }

  private async startCamera(): Promise<void> {
    const onFrame = (result: any, error: any) => {
      this.starting.set(false);
      if (result) {
        this.controls?.stop();
        this.lookup(result.getText());
      } else if (error && !(error instanceof NotFoundException)) {
        this.errorMessage.set('No se pudo leer la cámara. Intenta de nuevo.');
      }
    };
    try {
      this.controls = await this.reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        this.videoRef.nativeElement,
        onFrame,
      );
    } catch {
      try {
        this.controls = await this.reader.decodeFromConstraints({ video: true }, this.videoRef.nativeElement, onFrame);
      } catch {
        this.starting.set(false);
        this.errorMessage.set('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
      }
    }
  }

  private lookup(code: string): void {
    this.looking.set(true);
    this.notFoundCode.set(null);
    this.productService.findByCode(code).subscribe({
      next: (res) => {
        this.looking.set(false);
        this.product.set(res.data);
      },
      error: () => {
        this.looking.set(false);
        this.notFoundCode.set(code);
      },
    });
  }

  scanAgain(): void {
    this.product.set(null);
    this.notFoundCode.set(null);
    this.errorMessage.set(null);
    this.starting.set(true);
    this.startCamera();
  }

  editProduct(): void {
    const product = this.product();
    if (!product) return;
    const ref = this.dialog.open<ProductFormComponent, ProductFormData, Product | null>(ProductFormComponent, {
      data: { product, duplicateFrom: null },
      width: '960px',
      maxWidth: '95vw',
      autoFocus: false,
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.product.set(updated);
        this.snackBar.open('Producto actualizado', 'Cerrar', { duration: 2500 });
      }
    });
  }

  registerMovement(): void {
    const product = this.product();
    if (!product) return;
    const ref = this.dialog.open<MovementFormComponent, MovementFormData, boolean>(MovementFormComponent, {
      data: { product },
      width: '520px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.productService.findById(product.id).subscribe((res) => this.product.set(res.data));
      }
    });
  }

  exit(): void {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    this.controls?.stop();
  }
}
