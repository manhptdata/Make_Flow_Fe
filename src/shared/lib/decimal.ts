import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const decimal = (value: Decimal.Value = 0) => new Decimal(value);

export function formatMoney(value: Decimal.Value, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 4,
  }).format(decimal(value).toNumber());
}

export function formatQuantity(value: Decimal.Value, maximumFractionDigits = 3) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(decimal(value).toNumber());
}
