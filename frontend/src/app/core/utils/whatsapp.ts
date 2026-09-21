/** RamichanStore no tiene correo/SMS transaccional — wa.me es el único canal "automático" disponible. */
export function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 9 ? `51${digits}` : digits;
}

export function whatsAppLink(rawPhone: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(rawPhone)}?text=${encodeURIComponent(message)}`;
}
