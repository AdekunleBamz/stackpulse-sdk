export const NETWORKS = ['mainnet', 'testnet'];

export const API_BASE_URLS = {
  mainnet: 'https://api.mainnet.hiro.so',
  testnet: 'https://api.testnet.hiro.so',
};

export const DEFAULT_DEPLOYER_BY_NETWORK = {
  mainnet: 'SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT',
  testnet: 'ST5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT',
};

export const DEFAULT_CONTRACTS_BY_NETWORK = {
  mainnet: {
    registry: 'stackpulse-v-j3',
    alerts: 'alert-manager-v-j3',
    vault: 'fee-vault-v-j3',
    badges: 'reputation-badges-v-j3',
  },
  testnet: {
    registry: 'stackpulse-v-j3',
    alerts: 'alert-manager-v-j3',
    vault: 'fee-vault-v-j3',
    badges: 'reputation-badges-v-j3',
  },
};

export const MAX_TIER = 3;
export const MAX_ALERTS_BITMASK = 31;

export const TIER_PRICES_MICRO_STX = {
  0: 0,
  1: 10_000,
  2: 50_000,
  3: 200_000,
};

export const ALERT_TYPE = {
  WHALE_TRANSFER: 1,
  CONTRACT_DEPLOYED: 2,
  NFT_MINT: 3,
  TOKEN_LAUNCH: 4,
  LARGE_SWAP: 5,
  ADDRESS_WATCH: 6,
};
