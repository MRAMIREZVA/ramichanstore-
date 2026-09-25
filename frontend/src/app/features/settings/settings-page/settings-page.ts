import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Brand, Category, ProductLine, Supplier } from '../../../core/models/catalog.model';
import { DeliveryAgency } from '../../../core/models/delivery-agency.model';
import { Setting } from '../../../core/models/setting.model';
import { CatalogService } from '../../../core/services/catalog.service';
import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { SettingService } from '../../../core/services/setting.service';
import { resolveImageUrl } from '../../../core/utils/image-url';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { DeliveryAgencyFormComponent, DeliveryAgencyFormData } from '../delivery-agency-form/delivery-agency-form';
import { NameDescriptionFormComponent, NameDescriptionFormData } from '../name-description-form/name-description-form';
import { ProductLineFormComponent, ProductLineFormData } from '../product-line-form/product-line-form';
import { SupplierFormComponent, SupplierFormData } from '../supplier-form/supplier-form';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly publicCatalogService = inject(PublicCatalogService);
  private readonly settingService = inject(SettingService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly resolveImageUrl = resolveImageUrl;

  readonly loadingSettings = signal(true);
  readonly settings = signal<Setting[]>([]);
  readonly settingDrafts = new Map<number, string>();

  readonly loadingBanner = signal(true);
  readonly bannerUrl = signal<string | null>(null);
  readonly bannerVersion = signal(0);
  readonly uploadingBanner = signal(false);

  readonly loadingAnnouncement = signal(true);
  readonly announcementUrl = signal<string | null>(null);
  readonly announcementVersion = signal(0);
  readonly uploadingAnnouncement = signal(false);

  readonly loadingCategories = signal(true);
  readonly categories = signal<Category[]>([]);

  readonly loadingBrands = signal(true);
  readonly brands = signal<Brand[]>([]);

  readonly loadingLines = signal(true);
  readonly lines = signal<ProductLine[]>([]);

  readonly loadingSuppliers = signal(true);
  readonly suppliers = signal<Supplier[]>([]);

  readonly loadingDeliveryAgencies = signal(true);
  readonly deliveryAgencies = signal<DeliveryAgency[]>([]);

  readonly nameColumns = ['name', 'description', 'actions'];
  readonly agencyColumns = ['name', 'actions'];
  readonly lineColumns = ['name', 'brand', 'description', 'actions'];
  readonly supplierColumns = ['name', 'company', 'contact', 'country', 'actions'];

  ngOnInit(): void {
    this.loadSettings();
    this.loadCategories();
    this.loadBrands();
    this.loadLines();
    this.loadSuppliers();
    this.loadDeliveryAgencies();
    this.loadBanner();
    this.loadAnnouncement();
  }

  loadBanner(): void {
    this.loadingBanner.set(true);
    this.publicCatalogService.getStoreInfo().subscribe({
      next: (res) => {
        this.bannerUrl.set(res.data.bannerUrl);
        this.loadingBanner.set(false);
      },
      error: () => this.loadingBanner.set(false),
    });
  }

  get bannerPreviewUrl(): string | null {
    const url = this.bannerUrl();
    if (!url) return null;
    return `${this.resolveImageUrl(url)}?v=${this.bannerVersion()}`;
  }

  onBannerFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.snackBar.open('Formato no soportado (usa JPG, PNG, WEBP o GIF)', 'Cerrar', { duration: 4000 });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.snackBar.open('La imagen supera el límite de 5MB', 'Cerrar', { duration: 4000 });
      return;
    }

    this.uploadingBanner.set(true);
    this.catalogService.uploadCatalogBanner(file).subscribe({
      next: (res) => {
        this.uploadingBanner.set(false);
        this.bannerVersion.update((v) => v + 1);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.loadBanner();
      },
      error: () => this.uploadingBanner.set(false),
    });
  }

  confirmDeleteBanner(): void {
    const data: ConfirmDialogData = {
      title: 'Quitar banner',
      message: '¿Quitar el banner de inicio del catálogo? Volverá a mostrarse el degradado por defecto.',
      confirmLabel: 'Quitar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.catalogService.deleteCatalogBanner().subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadBanner();
        },
      });
    });
  }

  loadAnnouncement(): void {
    this.loadingAnnouncement.set(true);
    this.publicCatalogService.getStoreInfo().subscribe({
      next: (res) => {
        this.announcementUrl.set(res.data.announcementImageUrl);
        this.loadingAnnouncement.set(false);
      },
      error: () => this.loadingAnnouncement.set(false),
    });
  }

  get announcementPreviewUrl(): string | null {
    const url = this.announcementUrl();
    if (!url) return null;
    return `${this.resolveImageUrl(url)}?v=${this.announcementVersion()}`;
  }

  onAnnouncementFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.snackBar.open('Formato no soportado (usa JPG, PNG, WEBP o GIF)', 'Cerrar', { duration: 4000 });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.snackBar.open('La imagen supera el límite de 5MB', 'Cerrar', { duration: 4000 });
      return;
    }

    this.uploadingAnnouncement.set(true);
    this.catalogService.uploadCatalogAnnouncement(file).subscribe({
      next: (res) => {
        this.uploadingAnnouncement.set(false);
        this.announcementVersion.update((v) => v + 1);
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.loadAnnouncement();
      },
      error: () => this.uploadingAnnouncement.set(false),
    });
  }

  confirmDeleteAnnouncement(): void {
    const data: ConfirmDialogData = {
      title: 'Quitar anuncio',
      message: '¿Quitar la imagen del panel de bienvenida? Los visitantes dejarán de verlo al entrar al catálogo.',
      confirmLabel: 'Quitar',
      destructive: true,
    };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.catalogService.deleteCatalogAnnouncement().subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadAnnouncement();
        },
      });
    });
  }

  loadSettings(): void {
    this.loadingSettings.set(true);
    this.settingService.findAll().subscribe({
      next: (res) => {
        this.settings.set(res.data);
        this.settingDrafts.clear();
        res.data.forEach((s) => this.settingDrafts.set(s.id, s.value));
        this.loadingSettings.set(false);
      },
      error: () => this.loadingSettings.set(false),
    });
  }

  draftFor(setting: Setting): string {
    return this.settingDrafts.get(setting.id) ?? setting.value;
  }

  onDraftChange(setting: Setting, value: string): void {
    this.settingDrafts.set(setting.id, value);
  }

  isDirty(setting: Setting): boolean {
    return this.draftFor(setting) !== setting.value;
  }

  saveSetting(setting: Setting): void {
    this.settingService.updateValue(setting.key, this.draftFor(setting)).subscribe({
      next: (res) => {
        this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
        this.loadSettings();
      },
    });
  }

  loadCategories(): void {
    this.loadingCategories.set(true);
    this.catalogService.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false),
    });
  }

  loadBrands(): void {
    this.loadingBrands.set(true);
    this.catalogService.getBrands().subscribe({
      next: (res) => {
        this.brands.set(res.data);
        this.loadingBrands.set(false);
      },
      error: () => this.loadingBrands.set(false),
    });
  }

  loadLines(): void {
    this.loadingLines.set(true);
    this.catalogService.getProductLines().subscribe({
      next: (res) => {
        this.lines.set(res.data);
        this.loadingLines.set(false);
      },
      error: () => this.loadingLines.set(false),
    });
  }

  loadSuppliers(): void {
    this.loadingSuppliers.set(true);
    this.catalogService.getSuppliers().subscribe({
      next: (res) => {
        this.suppliers.set(res.data);
        this.loadingSuppliers.set(false);
      },
      error: () => this.loadingSuppliers.set(false),
    });
  }

  openCategoryForm(item: Category | null): void {
    const data: NameDescriptionFormData = { title: item ? 'Editar categoría' : 'Nueva categoría', item };
    const ref = this.dialog.open(NameDescriptionFormComponent, { data, width: '460px', autoFocus: false });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      const obs = item ? this.catalogService.updateCategory(item.id, request) : this.catalogService.createCategory(request);
      obs.subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadCategories();
        },
      });
    });
  }

  confirmDeleteCategory(item: Category): void {
    this.confirmAndDelete(
      `¿Eliminar la categoría "${item.name}"?`,
      () => this.catalogService.deleteCategory(item.id),
      () => this.loadCategories(),
    );
  }

  openBrandForm(item: Brand | null): void {
    const data: NameDescriptionFormData = { title: item ? 'Editar marca' : 'Nueva marca', item };
    const ref = this.dialog.open(NameDescriptionFormComponent, { data, width: '460px', autoFocus: false });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      const obs = item ? this.catalogService.updateBrand(item.id, request) : this.catalogService.createBrand(request);
      obs.subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadBrands();
          this.loadLines();
        },
      });
    });
  }

  confirmDeleteBrand(item: Brand): void {
    this.confirmAndDelete(
      `¿Eliminar la marca "${item.name}"?`,
      () => this.catalogService.deleteBrand(item.id),
      () => this.loadBrands(),
    );
  }

  openLineForm(item: ProductLine | null): void {
    const data: ProductLineFormData = { line: item, brands: this.brands() };
    const ref = this.dialog.open(ProductLineFormComponent, { data, width: '480px', autoFocus: false });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      const obs = item ? this.catalogService.updateProductLine(item.id, request) : this.catalogService.createProductLine(request);
      obs.subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadLines();
        },
      });
    });
  }

  confirmDeleteLine(item: ProductLine): void {
    this.confirmAndDelete(
      `¿Eliminar la línea "${item.name}"?`,
      () => this.catalogService.deleteProductLine(item.id),
      () => this.loadLines(),
    );
  }

  openSupplierForm(item: Supplier | null): void {
    const data: SupplierFormData = { supplier: item };
    const ref = this.dialog.open(SupplierFormComponent, { data, width: '620px', maxWidth: '95vw', autoFocus: false });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      const obs = item ? this.catalogService.updateSupplier(item.id, request) : this.catalogService.createSupplier(request);
      obs.subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadSuppliers();
        },
      });
    });
  }

  confirmDeleteSupplier(item: Supplier): void {
    this.confirmAndDelete(
      `¿Eliminar el proveedor "${item.name}"?`,
      () => this.catalogService.deleteSupplier(item.id),
      () => this.loadSuppliers(),
    );
  }

  loadDeliveryAgencies(): void {
    this.loadingDeliveryAgencies.set(true);
    this.catalogService.getDeliveryAgencies().subscribe({
      next: (res) => {
        this.deliveryAgencies.set(res.data);
        this.loadingDeliveryAgencies.set(false);
      },
      error: () => this.loadingDeliveryAgencies.set(false),
    });
  }

  openDeliveryAgencyForm(item: DeliveryAgency | null): void {
    const data: DeliveryAgencyFormData = { agency: item };
    const ref = this.dialog.open(DeliveryAgencyFormComponent, { data, width: '420px', autoFocus: false });
    ref.afterClosed().subscribe((request) => {
      if (!request) return;
      const obs = item
        ? this.catalogService.updateDeliveryAgency(item.id, request)
        : this.catalogService.createDeliveryAgency(request);
      obs.subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          this.loadDeliveryAgencies();
        },
      });
    });
  }

  confirmDeleteDeliveryAgency(item: DeliveryAgency): void {
    this.confirmAndDelete(
      `¿Eliminar la agencia "${item.name}"?`,
      () => this.catalogService.deleteDeliveryAgency(item.id),
      () => this.loadDeliveryAgencies(),
    );
  }

  private confirmAndDelete(message: string, action: () => Observable<{ message: string }>, onDone: () => void): void {
    const data: ConfirmDialogData = { title: 'Confirmar eliminación', message, confirmLabel: 'Eliminar', destructive: true };
    const ref = this.dialog.open(ConfirmDialog, { data, width: '420px' });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      action().subscribe({
        next: (res) => {
          this.snackBar.open(res.message, 'Cerrar', { duration: 3000 });
          onDone();
        },
      });
    });
  }
}
