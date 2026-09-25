/** Maestro de agencias de envío (Shalom, Olva Courier, etc.) — editable por el admin. */
export interface DeliveryAgency {
  id: number;
  name: string;
}

export interface DeliveryAgencyRequest {
  name: string;
}
