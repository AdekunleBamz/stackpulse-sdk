import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import {
  ClarityType,
  PostConditionMode,
  cvToHex,
  cvToValue,
  hexToCV,
  noneCV,
  principalCV,
  someCV,
  stringAsciiCV,
  uintCV,
} from '@stacks/transactions';

import {
  API_BASE_URLS,
  DEFAULT_CONTRACTS_BY_NETWORK,
  DEFAULT_DEPLOYER_BY_NETWORK,
  MAX_ALERTS_BITMASK,
  MAX_TIER,
  NETWORKS,
} from './constants.js';
import { normalizeCvValue, parseUint } from './format.js';

function assertNetwork(network) {
  if (!NETWORKS.includes(network)) {
    throw new Error(`Invalid network "${String(network)}". Use "mainnet" or "testnet".`);
  }
}

function assertTier(tier) {
  const n = Number(tier);
  if (!Number.isInteger(n) || n < 0 || n > MAX_TIER) {
    throw new Error(`tier must be an integer between 0 and ${MAX_TIER}.`);
  }
  return n;
}

function assertAlertsBitmask(alertsBitmask) {
  const n = Number(alertsBitmask);
  if (!Number.isInteger(n) || n < 0 || n > MAX_ALERTS_BITMASK) {
    throw new Error(`alertsBitmask must be between 0 and ${MAX_ALERTS_BITMASK}.`);
  }
  return n;
}

function assertString(value, fieldName, maxLength) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`${fieldName} cannot be empty.`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters.`);
  }
  return normalized;
}

function decodeReadOnlyResult(resultHex) {
  const cv = hexToCV(resultHex);

  if (cv.type === ClarityType.ResponseErr) {
    const errValue = normalizeCvValue(cvToValue(cv.value));
    throw new Error(`Contract returned err: ${JSON.stringify(errValue)}`);
  }

  if (cv.type === ClarityType.ResponseOk) {
    return normalizeCvValue(cvToValue(cv.value));
  }

  return normalizeCvValue(cvToValue(cv));
}

function targetPrincipalCv(targetAddress) {
  if (!targetAddress) {
    return noneCV();
  }
  return someCV(principalCV(targetAddress));
}

export class StackPulseClient {
  constructor(options = {}) {
    const network = options.network ?? 'mainnet';
    assertNetwork(network);

    this.network = network;
    this.apiBaseUrl = options.apiBaseUrl ?? API_BASE_URLS[network];
    this.deployerAddress = options.deployerAddress ?? DEFAULT_DEPLOYER_BY_NETWORK[network];
    this.contracts = {
      ...DEFAULT_CONTRACTS_BY_NETWORK[network],
      ...(options.contracts ?? {}),
    };
    this.stacksNetwork = network === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
  }

  getContractId(contractKey) {
    const contractName = this.contracts[contractKey];
    if (!contractName) {
      throw new Error(`Unknown contract key "${contractKey}".`);
    }
    return `${this.deployerAddress}.${contractName}`;
  }

  getContractParts(contractKey) {
    const contractName = this.contracts[contractKey];
    if (!contractName) {
      throw new Error(`Unknown contract key "${contractKey}".`);
    }
    return [this.deployerAddress, contractName];
  }

  async callReadOnly(contractKey, functionName, args = [], options = {}) {
    const [contractAddress, contractName] = this.getContractParts(contractKey);
    const senderAddress = options.senderAddress ?? this.deployerAddress;

    const argumentHex = args.map(arg => {
      if (typeof arg === 'string' && arg.startsWith('0x')) return arg;
      return cvToHex(arg);
    });

    const response = await fetch(
      `${this.apiBaseUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: senderAddress,
          arguments: argumentHex,
        }),
      }
    );

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(
        `Read-only call failed (${response.status}) for ${contractName}.${functionName}: ${reason}`
      );
    }

    const payload = await response.json();
    if (!payload.okay) {
      throw new Error(`Read-only call returned not okay for ${contractName}.${functionName}.`);
    }

    return decodeReadOnlyResult(payload.result);
  }

  // Registry
  async getRegistryVersion() {
    return this.callReadOnly('registry', 'get-version');
  }

  async getUser(address) {
    return this.callReadOnly('registry', 'get-user', [principalCV(address)]);
  }

  async isRegistered(address) {
    return this.callReadOnly('registry', 'is-registered', [principalCV(address)]);
  }

  async getSubscriptionStatus(address) {
    return this.callReadOnly('registry', 'get-subscription-status', [principalCV(address)]);
  }

  async isSubscriptionActive(address) {
    return this.callReadOnly('registry', 'is-subscription-active', [principalCV(address)]);
  }

  async getTierPrice(tier) {
    return this.callReadOnly('registry', 'get-tier-price', [uintCV(parseUint(tier, 'tier'))]);
  }

  async getRegistryStats() {
    return this.callReadOnly('registry', 'get-stats');
  }

  // Alerts
  async getAlertManagerVersion() {
    return this.callReadOnly('alerts', 'get-version');
  }

  async getAlert(alertId) {
    return this.callReadOnly('alerts', 'get-alert', [uintCV(parseUint(alertId, 'alertId'))]);
  }

  async getUserAlertCount(address) {
    return this.callReadOnly('alerts', 'get-user-alert-count', [principalCV(address)]);
  }

  async getUserAlertByIndex(address, index) {
    return this.callReadOnly('alerts', 'get-user-alert-by-index', [
      principalCV(address),
      uintCV(parseUint(index, 'index')),
    ]);
  }

  async getUserAlertTypeCount(address, alertType) {
    return this.callReadOnly('alerts', 'get-user-alert-type-count', [
      principalCV(address),
      uintCV(parseUint(alertType, 'alertType')),
    ]);
  }

  async getMaxAlertsForTier(tier) {
    return this.callReadOnly('alerts', 'get-max-alerts-for-tier', [uintCV(parseUint(tier, 'tier'))]);
  }

  async getAlertManagerStats() {
    return this.callReadOnly('alerts', 'get-stats');
  }

  async isAlertActive(alertId) {
    return this.callReadOnly('alerts', 'is-alert-active', [uintCV(parseUint(alertId, 'alertId'))]);
  }

  // Fee vault
  async getVaultVersion() {
    return this.callReadOnly('vault', 'get-version');
  }

  async getSubscriptionPrice(tier) {
    return this.callReadOnly('vault', 'get-subscription-price', [uintCV(parseUint(tier, 'tier'))]);
  }

  async getTierRevenue(tier) {
    return this.callReadOnly('vault', 'get-tier-revenue', [uintCV(parseUint(tier, 'tier'))]);
  }

  async getUserPayments(address) {
    return this.callReadOnly('vault', 'get-user-payments', [principalCV(address)]);
  }

  async getReferralEarnings(address) {
    return this.callReadOnly('vault', 'get-referral-earnings', [principalCV(address)]);
  }

  async getReferralCount(address) {
    return this.callReadOnly('vault', 'get-referral-count', [principalCV(address)]);
  }

  async getReferrer(address) {
    return this.callReadOnly('vault', 'get-referrer', [principalCV(address)]);
  }

  async getVaultStats() {
    return this.callReadOnly('vault', 'get-vault-stats');
  }

  // Badges
  async getLastBadgeTokenId() {
    return this.callReadOnly('badges', 'get-last-token-id');
  }

  async getBadgeTokenUri(tokenId) {
    return this.callReadOnly('badges', 'get-token-uri', [uintCV(parseUint(tokenId, 'tokenId'))]);
  }

  async getBadgeOwner(tokenId) {
    return this.callReadOnly('badges', 'get-owner', [uintCV(parseUint(tokenId, 'tokenId'))]);
  }

  async getBadgeData(tokenId) {
    return this.callReadOnly('badges', 'get-badge-data', [uintCV(parseUint(tokenId, 'tokenId'))]);
  }

  async getBadgeDefinition(badgeType) {
    return this.callReadOnly('badges', 'get-badge-definition', [
      uintCV(parseUint(badgeType, 'badgeType')),
    ]);
  }

  async hasBadge(address, badgeType) {
    return this.callReadOnly('badges', 'has-badge', [
      principalCV(address),
      uintCV(parseUint(badgeType, 'badgeType')),
    ]);
  }

  async getUserBadgeToken(address, badgeType) {
    return this.callReadOnly('badges', 'get-user-badge-token', [
      principalCV(address),
      uintCV(parseUint(badgeType, 'badgeType')),
    ]);
  }

  async getBadgeStats() {
    return this.callReadOnly('badges', 'get-stats');
  }

  async isAuthorizedMinter(address) {
    return this.callReadOnly('badges', 'is-authorized-minter', [principalCV(address)]);
  }

  // Transaction builders: registry
  buildRegisterAndSubscribeTxOptions({
    username,
    email = '',
    tier = 0,
    alertsBitmask = MAX_ALERTS_BITMASK,
  }) {
    const cleanUsername = assertString(username, 'username', 32);
    const cleanEmail = String(email).slice(0, 64);
    const safeTier = assertTier(tier);
    const safeAlertsBitmask = assertAlertsBitmask(alertsBitmask);

    const [contractAddress, contractName] = this.getContractParts('registry');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'register-and-subscribe',
      functionArgs: [
        stringAsciiCV(cleanUsername),
        stringAsciiCV(cleanEmail),
        uintCV(parseUint(safeTier, 'tier')),
        uintCV(parseUint(safeAlertsBitmask, 'alertsBitmask')),
      ],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildUpdateProfileTxOptions({ username, email = '', alertsBitmask = MAX_ALERTS_BITMASK }) {
    const cleanUsername = assertString(username, 'username', 32);
    const cleanEmail = String(email).slice(0, 64);
    const safeAlertsBitmask = assertAlertsBitmask(alertsBitmask);
    const [contractAddress, contractName] = this.getContractParts('registry');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'update-profile',
      functionArgs: [
        stringAsciiCV(cleanUsername),
        stringAsciiCV(cleanEmail),
        uintCV(parseUint(safeAlertsBitmask, 'alertsBitmask')),
      ],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildUpgradeSubscriptionTxOptions(newTier) {
    const safeTier = assertTier(newTier);
    if (safeTier === 0) {
      throw new Error('newTier must be 1..3 for upgrade-subscription.');
    }
    const [contractAddress, contractName] = this.getContractParts('registry');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'upgrade-subscription',
      functionArgs: [uintCV(parseUint(safeTier, 'newTier'))],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildSetAlertsTxOptions(alertsBitmask) {
    const safeAlertsBitmask = assertAlertsBitmask(alertsBitmask);
    const [contractAddress, contractName] = this.getContractParts('registry');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'set-alerts',
      functionArgs: [uintCV(parseUint(safeAlertsBitmask, 'alertsBitmask'))],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  // Transaction builders: alerts
  buildCreateAlertTxOptions({
    alertType,
    name,
    targetAddress = null,
    threshold = 10_000,
    userTier = 0,
  }) {
    const cleanName = assertString(name, 'name', 64);
    const [contractAddress, contractName] = this.getContractParts('alerts');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'create-alert',
      functionArgs: [
        uintCV(parseUint(alertType, 'alertType')),
        stringAsciiCV(cleanName),
        targetPrincipalCv(targetAddress),
        uintCV(parseUint(threshold, 'threshold')),
        uintCV(parseUint(assertTier(userTier), 'userTier')),
      ],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildToggleAlertTxOptions(alertId) {
    const [contractAddress, contractName] = this.getContractParts('alerts');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'toggle-alert',
      functionArgs: [uintCV(parseUint(alertId, 'alertId'))],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildDeleteAlertTxOptions(alertId) {
    const [contractAddress, contractName] = this.getContractParts('alerts');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'delete-alert',
      functionArgs: [uintCV(parseUint(alertId, 'alertId'))],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildRecordTriggerTxOptions(alertId) {
    const [contractAddress, contractName] = this.getContractParts('alerts');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'record-trigger',
      functionArgs: [uintCV(parseUint(alertId, 'alertId'))],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildUpdateAlertTxOptions({ alertId, name, targetAddress = null, threshold = 10_000 }) {
    const cleanName = assertString(name, 'name', 64);
    const [contractAddress, contractName] = this.getContractParts('alerts');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'update-alert',
      functionArgs: [
        uintCV(parseUint(alertId, 'alertId')),
        stringAsciiCV(cleanName),
        targetPrincipalCv(targetAddress),
        uintCV(parseUint(threshold, 'threshold')),
      ],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  // Transaction builders: fee vault
  buildCollectSubscriptionFeeTxOptions({ tier, referrer = null }) {
    const safeTier = assertTier(tier);
    const [contractAddress, contractName] = this.getContractParts('vault');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'collect-subscription-fee',
      functionArgs: [
        uintCV(parseUint(safeTier, 'tier')),
        referrer ? someCV(principalCV(referrer)) : noneCV(),
      ],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildCollectPlatformFeeTxOptions({ amount, feeType }) {
    const cleanFeeType = assertString(feeType, 'feeType', 32);
    const [contractAddress, contractName] = this.getContractParts('vault');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'collect-platform-fee',
      functionArgs: [uintCV(parseUint(amount, 'amount')), stringAsciiCV(cleanFeeType)],
      postConditionMode: PostConditionMode.Allow,
    };
  }

  buildWithdrawReferralEarningsTxOptions() {
    const [contractAddress, contractName] = this.getContractParts('vault');

    return {
      network: this.stacksNetwork,
      contractAddress,
      contractName,
      functionName: 'withdraw-referral-earnings',
      functionArgs: [],
      postConditionMode: PostConditionMode.Allow,
    };
  }
}
