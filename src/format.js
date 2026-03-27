function assertNonNegativeBigInt(value, fieldName) {
  if (typeof value !== 'bigint' || value < 0n) {
    throw new Error(`${fieldName} must be a non-negative bigint.`);
  }
}

export function stxToMicroStx(amountStx) {
  const raw = String(amountStx).trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    throw new Error('amountStx must be a positive number string, number, or bigint.');
  }

  const [whole, fraction = ''] = raw.split('.');
  if (fraction.length > 6) {
    throw new Error('amountStx supports at most 6 decimal places.');
  }

  const micros = BigInt(whole) * 1_000_000n + BigInt((fraction + '000000').slice(0, 6));
  return micros;
}

export function microStxToStx(amountMicroStx) {
  const value = typeof amountMicroStx === 'bigint' ? amountMicroStx : BigInt(amountMicroStx);
  assertNonNegativeBigInt(value, 'amountMicroStx');

  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, '0');
  return `${whole.toString()}.${fraction}`;
}

export function formatStx(amountMicroStx, maxFractionDigits = 6) {
  const raw = microStxToStx(amountMicroStx);
  const [whole, fraction] = raw.split('.');
  const trimmed = fraction.replace(/0+$/, '').slice(0, maxFractionDigits);
  return trimmed.length ? `${whole}.${trimmed}` : whole;
}

export function normalizeCvValue(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(normalizeCvValue);
  }

  if (typeof value === 'object') {
    const typed = value;
    if (Object.prototype.hasOwnProperty.call(typed, 'type') && Object.prototype.hasOwnProperty.call(typed, 'value')) {
      const type = String(typed.type || '');

      if (type === 'uint' || type === 'int') {
        try {
          return BigInt(String(typed.value));
        } catch {
          return 0n;
        }
      }

      if (type === 'bool') {
        return Boolean(typed.value);
      }

      if (type.includes('string-ascii') || type.includes('string-utf8') || type === 'principal') {
        return String(typed.value || '');
      }

      if (type.includes('buff')) {
        return String(typed.value || '');
      }

      return normalizeCvValue(typed.value);
    }

    const entries = Object.entries(typed).map(([k, v]) => [k, normalizeCvValue(v)]);
    return Object.fromEntries(entries);
  }

  return value;
}

export function parseUint(value, fieldName = 'value') {
  const n = typeof value === 'bigint' ? value : BigInt(value);
  if (n < 0n) {
    throw new Error(`${fieldName} must be >= 0.`);
  }
  return n;
}
