import { Component, ViewChild } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { PendingArticlesList } from '../pending-articles-list/pending-articles-list';
import { ShipmentHoldersList } from '../shipment-holders-list/shipment-holders-list';
import { ShipmentRecipientsList } from '../shipment-recipients-list/shipment-recipients-list';
import { ShipmentTypeOptionsList } from '../shipment-type-options-list/shipment-type-options-list';
import { ShipmentsList } from '../shipments-list/shipments-list';

/** "Embarques desde Japón" — digitaliza la planilla Excel de compras consolidadas vía cuentas proxy (Zenmarket). */
@Component({
  selector: 'app-shipments-page',
  standalone: true,
  imports: [MatTabsModule, ShipmentsList, ShipmentHoldersList, ShipmentRecipientsList, ShipmentTypeOptionsList, PendingArticlesList],
  templateUrl: './shipments-page.html',
  styleUrl: './shipments-page.scss',
})
export class ShipmentsPage {
  @ViewChild(PendingArticlesList) private pendingArticlesList?: PendingArticlesList;

  /**
   * "Artículos comprados" (índice 4) queda desactualizada si se sube/cambia la foto de
   * un artículo desde el diálogo de edición de embarque, que vive en la pestaña
   * "Embarques" (índice 0) — un componente hermano, sin forma de avisarle a este que
   * algo cambió. `[preserveContent]="true"` (Fase 15, evita recargar las 5 pestañas de
   * golpe) tiene el efecto secundario de que el componente de una pestaña nunca se
   * recrea al volver a seleccionarla, así que su `ngOnInit` tampoco vuelve a correr —
   * sin este refresco explícito, la pestaña queda congelada con la foto/estado de la
   * última vez que se abrió, aunque el dato real ya esté actualizado en la BD.
   */
  onTabChange(event: MatTabChangeEvent): void {
    if (event.index === 4) this.pendingArticlesList?.load();
  }
}
