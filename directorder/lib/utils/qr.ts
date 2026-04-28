export function generateTableQRUrl(
  restaurantSlug: string,
  tableNumber: string
): string {
  return `https://directorder.app/${restaurantSlug}/table/${tableNumber}`
}
