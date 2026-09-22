package com.ramichanstore.backend.modules.shipments.entity;

/** Invoice/factura son documentos generales de la compra; DIF/DIF_VOUCHER solo aplican cuando el embarque pasó por aduanas. */
public enum ShipmentDocumentType {
    INVOICE, DIF, DIF_VOUCHER, FACTURA
}
