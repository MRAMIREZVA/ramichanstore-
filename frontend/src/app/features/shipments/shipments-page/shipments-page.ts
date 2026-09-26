import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
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
export class ShipmentsPage {}
