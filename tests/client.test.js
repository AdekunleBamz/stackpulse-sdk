import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cvToHex, responseOkCV, stringAsciiCV, tupleCV, uintCV } from '@stacks/transactions';

import {
  MAX_ALERTS_BITMASK,
  StackPulseClient,
  normalizeCvValue,
  stxToMicroStx,
} from '../src/index.js';

describe('StackPulseClient', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('initializes with mainnet defaults', () => {
    const client = new StackPulseClient();
    expect(client.network).toBe('mainnet');
    expect(client.getContractId('registry')).toBe(
      'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT.stackpulse-v-j3'
    );
  });

  it('builds register tx options', () => {
    const client = new StackPulseClient();
    const options = client.buildRegisterAndSubscribeTxOptions({
      username: 'stackpulse',
      email: '',
      tier: 0,
      alertsBitmask: MAX_ALERTS_BITMASK,
    });

    expect(options.functionName).toBe('register-and-subscribe');
    expect(options.functionArgs).toHaveLength(4);
    expect(options.postConditionMode).toBeDefined();
  });

  it('builds create alert tx options', () => {
    const client = new StackPulseClient();
    const options = client.buildCreateAlertTxOptions({
      alertType: 1,
      name: 'Whale alert',
      threshold: stxToMicroStx('10000'),
      userTier: 2,
    });

    expect(options.functionName).toBe('create-alert');
    expect(options.functionArgs).toHaveLength(5);
  });

  it('decodes read-only tuple response', async () => {
    const client = new StackPulseClient();
    const payload = {
      okay: true,
      result: cvToHex(
        responseOkCV(
          tupleCV({
            'total-users': uintCV(12n),
            'total-revenue': uintCV(34n),
            version: stringAsciiCV('v3.0.0'),
          })
        )
      ),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
      text: async () => '',
    });

    const stats = await client.getRegistryStats();
    expect(stats['total-users']).toBe(12n);
    expect(stats['total-revenue']).toBe(34n);
    expect(stats.version).toBe('v3.0.0');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('normalizes nested cv objects', () => {
    const result = normalizeCvValue({
      type: '(tuple (ok bool) (amount uint))',
      value: {
        ok: { type: 'bool', value: true },
        amount: { type: 'uint', value: '123' },
      },
    });
    expect(result).toEqual({ ok: true, amount: 123n });
  });
});
