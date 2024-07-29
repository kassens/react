/* eslint-disable no-for-of-loops/no-for-of-loops */
/**
 * @flow
 */

import reconciler from 'react-reconciler';
import {ConcurrentRoot, NoEventPriority} from 'react-reconciler/constants';
import * as ReactFiberConfigFabric from 'react-native-renderer/src/ReactFiberConfigFabric';

const hostConfig = {
  ...ReactFiberConfigFabric,
};

const MockReconciler = reconciler(hostConfig);

function onRecoverableError() {
  console.error('TODO: onRecoverableError');
}

let idCounter = 1000;

export function createRoot() {
  const container = {
    kind: 'MockRoot',
    rootID: '' + idCounter++,
    pendingChildren: [],
    children: [],
  };
  const fiberRoot = MockReconciler.createContainer(
    container,
    ConcurrentRoot,
    null,
    null,
    false,
    '',
    MockReconciler.defaultOnUncaughtError,
    MockReconciler.defaultOnCaughtError,
    onRecoverableError,
    null,
  );
  return {
    render(children) {
      MockReconciler.updateContainer(children, fiberRoot, null, null);
    },
    toHTML(): string {
      let str = '<ROOT>\n';
      str += container.children
        .map(child => nodeToHTMLString(child, '  ') + '\n')
        .join('');
      str += '</ROOT>';
      return str;
    },
  };
}

function nodeToHTMLString(node: Node, offset: string): string {
  let str = offset + '<' + node.viewName;

  const props = node.props;
  if (props != null) {
    for (const [key, value] of Object.entries(props)) {
      const valueStr = (() => {
        if (value == null) {
          return null;
        }

        switch (typeof value) {
          case 'string':
            return `"${value}"`;

          case 'number':
          case 'boolean':
            return `{${String(value)}}`;

          case 'object':
            return `{${JSON.stringify(value)}}`;

          case 'function':
          default:
            return null;
        }
      })();

      if (valueStr != null) {
        str += ` ${key}=${valueStr}`;
      }
    }
  }

  if (node.children == null || node.children.length === 0) {
    return str + ' />';
  }

  str += '>\n';

  for (const childNode of node.children) {
    str += nodeToHTMLString(childNode, offset + '  ') + '\n';
  }

  str += offset + '</' + node.viewName + '>';

  return str;
}
