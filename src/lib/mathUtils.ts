/**
 * Safe decimal rounding using Number.EPSILON to handle floating-point anomalies.
 */
export const safeRound = (value: number, decimals: number): number => {
  const val = Number(value) || 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
};

/**
 * Round currency to 2 decimal places.
 */
export const roundCurrency = (value: number): number => {
  return safeRound(value, 2);
};

/**
 * Round quantity to 3 decimal places.
 */
export const roundQuantity = (value: number): number => {
  return safeRound(value, 3);
};

/**
 * Safe addition of two numbers, rounding to currency (2 decimal places).
 */
export const safeAdd = (a: number, b: number): number => {
  return roundCurrency((Number(a) || 0) + (Number(b) || 0));
};

/**
 * Safe subtraction of two numbers, rounding to currency (2 decimal places).
 */
export const safeSubtract = (a: number, b: number): number => {
  return roundCurrency((Number(a) || 0) - (Number(b) || 0));
};

/**
 * Safe multiplication of two numbers, rounding to currency (2 decimal places).
 */
export const safeMultiply = (a: number, b: number): number => {
  return roundCurrency((Number(a) || 0) * (Number(b) || 0));
};

/**
 * Safe division of two numbers.
 */
export const safeDivide = (a: number, b: number): number => {
  const divisor = Number(b) || 0;
  if (divisor === 0) return 0;
  return (Number(a) || 0) / divisor;
};
