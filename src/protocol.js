/**
 * Protocol metadata and typed helpers for the StackPulse ecosystem.
 */

/** @typedef {'mainnet' | 'testnet' | 'devnet'} NetworkType */
/** @typedef {{ address: string, network: NetworkType, isValid: boolean }} StacksAddress */
/** @typedef {{ contractAddress: string, contractName: string, network: NetworkType }} PulseConfig */

export const PROTOCOL_VERSION = '0.2.0';

/** @type {Readonly<PulseConfig>} */
export const DEFAULT_PROTOCOL_CONFIG = Object.freeze({
  contractAddress: 'SPXXXX',
  contractName: 'stackpulse-core',
  network: 'mainnet',
});

let protocolConfig = { ...DEFAULT_PROTOCOL_CONFIG };

/**
 * @param {Partial<PulseConfig>} [options={}]
 * @returns {PulseConfig & { version: string }}
 */
export function initializeProtocol(options = {}) {
  protocolConfig = {
    ...DEFAULT_PROTOCOL_CONFIG,
    ...options,
  };

  return getProtocolConfig();
}

/**
 * @returns {string}
 */
export function getProtocolVersion() {
  return PROTOCOL_VERSION;
}

/**
 * @returns {PulseConfig & { version: string }}
 */
export function getProtocolConfig() {
  return {
    ...protocolConfig,
    version: PROTOCOL_VERSION,
  };
}

/**
 * @param {string} address
 * @param {NetworkType} [network='mainnet']
 * @returns {StacksAddress}
 */
export function createStacksAddress(address, network = 'mainnet') {
  const normalized = typeof address === 'string' ? address.trim().toUpperCase() : '';
  return {
    address: normalized,
    network,
    isValid: /^S[PTMN][A-Z0-9]{38,40}$/i.test(normalized),
  };
}

/**
 * @param {Partial<PulseConfig>} [config={}]
 * @returns {PulseConfig}
 */
export function normalizePulseConfig(config = {}) {
  return {
    contractAddress: config.contractAddress ? String(config.contractAddress) : DEFAULT_PROTOCOL_CONFIG.contractAddress,
    contractName: config.contractName ? String(config.contractName) : DEFAULT_PROTOCOL_CONFIG.contractName,
    network: config.network || DEFAULT_PROTOCOL_CONFIG.network,
  };
}
