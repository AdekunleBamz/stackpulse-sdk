# stackpulse-sdk

Official JavaScript SDK for StackPulse V3 smart contracts on Stacks.

## Install

```bash
npm install stackpulse-sdk
```

## Quick Start

```js
import { StackPulseClient } from 'stackpulse-sdk';

const sdk = new StackPulseClient({ network: 'mainnet' });

const user = await sdk.getUser('SP...');
console.log(user);

const txOptions = sdk.buildRegisterAndSubscribeTxOptions({
  username: 'satoshi',
  email: '',
  tier: 0,
  alertsBitmask: 31,
});
```

## Features

- Read-only helpers for registry, alerts, fee vault, and badges.
- Transaction option builders for wallet contract calls.
- Clarity value normalization utilities.
- Mainnet/testnet configurable deployment settings.

## Contract Defaults

Mainnet deployer default:

`SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT`

Contracts:

- `stackpulse-v-j3`
- `alert-manager-v-j3`
- `fee-vault-v-j3`
- `reputation-badges-v-j3`
