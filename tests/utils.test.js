import { afterEach, describe, expect, it } from 'vitest';

import {
  createStacksAddress,
  formatAddress,
  formatAlertsBitmask,
  formatAlertThreshold,
  getProtocolConfig,
  getProtocolVersion,
  initializeProtocol,
  normalizePulseConfig,
  retry,
  validateStacksAddress,
  validateStacksAddressResult,
} from '../src/index.js';

afterEach(() => {
  initializeProtocol();
});

describe('StackPulse shared helpers', () => {
  it('formats addresses and alert metadata', () => {
    expect(formatAddress('SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT')).toBe('SP5K2R...9TJT');
    expect(formatAlertThreshold('1000000')).toBe('1,000,000');
    expect(formatAlertsBitmask(31)).toBe('0b11111');
  });

  it('validates stacks addresses', () => {
    expect(validateStacksAddress('SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT')).toBe(true);
    expect(validateStacksAddress('bad-address')).toBe(false);
    expect(validateStacksAddressResult(' sp5k2rhmsbh4pap4pgx77mcvnk1zeed07cwx9tjt ')).toEqual({
      valid: true,
      address: 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT',
    });
  });

  it('retries asynchronous work', async () => {
    let attempts = 0;
    const result = await retry(async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error('temporary');
      }
      return 'ok';
    }, 2);

    expect(result).toBe('ok');
    expect(attempts).toBe(2);
  });
});

describe('StackPulse protocol helpers', () => {
  it('initializes and reads protocol config', () => {
    const config = initializeProtocol({
      contractAddress: 'SP123',
      contractName: 'stackpulse-v4',
      network: 'testnet',
    });

    expect(config).toEqual({
      contractAddress: 'SP123',
      contractName: 'stackpulse-v4',
      network: 'testnet',
      version: '0.2.0',
    });
    expect(getProtocolVersion()).toBe('0.2.0');
    expect(getProtocolConfig()).toEqual(config);
  });

  it('creates and normalizes typed config values', () => {
    expect(createStacksAddress('SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT')).toEqual({
      address: 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT',
      network: 'mainnet',
      isValid: true,
    });

    expect(
      normalizePulseConfig({
        contractAddress: 'SPABC',
        contractName: 'registry',
      })
    ).toEqual({
      contractAddress: 'SPABC',
      contractName: 'registry',
      network: 'mainnet',
    });
  });
});
