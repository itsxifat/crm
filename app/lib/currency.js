// app/lib/currency.js
export function getCurrencySymbol() {
  // SSR + Client compatible
  return (
    process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ||
    process.env.CURRENCY_SYMBOL ||
    "৳"
  );
}

export function formatMoney(n, symbol = getCurrencySymbol()) {
  const num = Number(n || 0);
  // Keep the Taka symbol prefix, with your design using e.g. "৳12,345.00"
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
