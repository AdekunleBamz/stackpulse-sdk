/**
 * Shared utility helpers for StackPulse SDK consumers.
 */

/** @typedef {{ valid: boolean, address?: string, error?: string }} ValidationResult */

const STACKS_ADDRESS_PATTERN = /^S[PTMN][A-Z0-9]{38,40}$/i;

/**
 * @param {string} address
 * @param {number} [start=6]
 * @param {number} [end=4]
 * @returns {string}
 */
export function formatAddress(address, start = 6, end = 4) {
  if (!address || typeof address !== 'string') {
    return '';
  }

  const normalized = address.trim();
  if (normalized.length <= start + end) {
    return normalized;
  }

  return `${normalized.slice(0, start)}...${normalized.slice(-end)}`;
}

/**
 * @param {string} address
 * @returns {ValidationResult}
 */
export function validateStacksAddressResult(address) {
  if (typeof address !== 'string') {
    return { valid: false, error: 'Address must be a string.' };
  }

  const normalized = address.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: 'Address is required.' };
  }

  if (!STACKS_ADDRESS_PATTERN.test(normalized)) {
    return {
      valid: false,
      address: normalized,
      error: 'Address must be a valid Stacks address.',
    };
  }

  return { valid: true, address: normalized };
}

/**
 * @param {string} address
 * @returns {boolean}
 */
export function validateStacksAddress(address) {
  return validateStacksAddressResult(address).valid;
}

/**
 * @param {number | string | bigint} threshold
 * @returns {string}
 */
export function formatAlertThreshold(threshold) {
  const numericValue = Number(threshold);
  if (!Number.isFinite(numericValue)) {
    return '0';
  }

  return numericValue.toLocaleString();
}

/**
 * @param {number | string | bigint} mask
 * @returns {string}
 */
export function formatAlertsBitmask(mask) {
  const numericValue = Number(mask);
  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return '0b0';
  }

  return `0b${numericValue.toString(2)}`;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number} [retries=3]
 * @returns {Promise<T>}
 */
export async function retry(fn, retries = 3) {
  const maxAttempts = Number.isInteger(retries) && retries > 0 ? retries : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new Error('Retry exhausted without executing the operation.');
}
