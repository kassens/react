/* eslint-disable react-internal/prod-error-codes */
/* eslint-disable react-internal/no-production-logging */
/* eslint-disable no-for-of-loops/no-for-of-loops */

const glob = require('glob');
const fs = require('fs');
const assert = require('assert');
const chalk = require('chalk');

// read files starting with ReactFeatureFlags in this directory
function getFiles() {
  return glob.sync(`${__dirname}/ReactFeatureFlags.*`);
}

function getFlags(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const flags = {};
  content.replace(/export const (\w+) =(.*);/g, (_, flag, rawValue) => {
    let value;
    switch (rawValue) {
      case ' true':
        value = true;
        break;
      case ' false':
        value = false;
        break;
      case ' __PROFILE__':
        value = 'PROFILE';
        break;
      case ' __VARIANT__':
        value = 'VARIANT';
        break;
      case ' !__VARIANT__':
        value = 'NOT VARIANT';
        break;
      case ' __EXPERIMENTAL__':
        value = 'EXPERIMENTAL';
        break;
      case ' !__EXPERIMENTAL__':
        value = 'NOT EXPERIMENTAL';
        break;
      case ' __DEV__':
        value = 'DEV';
        break;
      default:
        throw new Error(`Unexpected value for flag ${flag}: ${rawValue}`);
    }
    flags[flag] = value;
  });
  return flags;
}

// enableUseRefAccessWarning is not actually defined on xplat feature flags

let table = {
  disableInputAttributeSyncing: {www: 'DYNAMIC'},
  enableLegacyFBSupport: {www: 'DYNAMIC'},
  disableIEWorkarounds: {www: 'DYNAMIC'},
  diffInCommitPhase: {www: 'DYNAMIC'},
  enableTrustedTypesIntegration: {www: 'DYNAMIC'},
  enableAsyncActions: {www: 'DYNAMIC'},
  enableDO_NOT_USE_disableStrictPassiveEffect: {www: 'DYNAMIC'},
  disableSchedulerTimeoutInWorkLoop: {www: 'DYNAMIC'},
  enableCustomElementPropertySupport: {www: 'DYNAMIC'},
  enableDeferRootSchedulingToMicrotask: {
    www: 'DYNAMIC',
    'native-fb': 'DYNAMIC',
  },
  alwaysThrottleRetries: {www: 'DYNAMIC', 'native-fb': 'DYNAMIC'},
  enableUseRefAccessWarning: {www: 'DYNAMIC', 'native-fb': 'TODO'},
  enableUnifiedSyncLane: {www: 'DYNAMIC'},
  enableSchedulingProfiler: {www: 'DYNAMIC'},
  enableProfilerNestedUpdateScheduledHook: {www: 'DYNAMIC'},
  enableTransitionTracing: {www: 'DYNAMIC'},
  enableLazyContextPropagation: {www: 'DYNAMIC'},
  enableDebugTracing: {
    www: 'TODO',
  },
  replayFailedUnitOfWorkWithInvokeGuardedCallback: {
    www: 'TODO',
  },
};

for (const filename of getFiles()) {
  let variant = filename.match(/ReactFeatureFlags\.(.*)\.js/)[1];
  const dynamic = variant.endsWith('-dynamic');
  if (dynamic) {
    variant = variant.replace('-dynamic', '');
  }
  for (const [flag, value] of Object.entries(getFlags(filename))) {
    if (table[flag] === undefined) {
      table[flag] = {};
    }
    if (dynamic) {
      assert(
        table[flag][variant] !== undefined,
        `should be dynamic configured: ${flag} in ${variant}`,
      );
    } else {
      assert(table[flag][variant] === undefined, `duplicate flag: ${flag}`);
      table[flag][variant] = value;
    }
  }
}

table = Object.fromEntries(Object.entries(table).sort());

console.table(table);

for (const [flag, variants] of Object.entries(table)) {
  const values = Object.values(variants);
  if (values.every(x => x === values[0])) {
    let message = `${flag} is always ${values[0]}`;
    if (values.length !== 6) {
      message = chalk.dim(`${message}, but not always set`);
    }
    console.log(message);
  }
}
