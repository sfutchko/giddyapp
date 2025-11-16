/**
 * Format cents to currency string
 * @param cents Amount in cents
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars)
}
