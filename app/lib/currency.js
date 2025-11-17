export function getCurrencySymbol() {
  return (
    process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ||
    process.env.CURRENCY_SYMBOL ||
    "৳"
  );
}

export function formatMoney(n, symbol = getCurrencySymbol()) {
  const num = Number(n || 0);
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}