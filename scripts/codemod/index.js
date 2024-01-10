/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ESNode, CallExpression} from 'hermes-estree';
import type {TransformContext} from 'hermes-transform';

const {transform, t} = require('hermes-transform');
const Glob = require('glob');
const {readFileSync, writeFileSync} = require('fs');

// $FlowFixMe[cannot-resolve-module]
const prettierOptions = require('../../.prettierrc.js');

function createVisitors(context: TransformContext) {
  const updated = new Set<ESNode>();
  return {
    CallExpression(node: CallExpression) {
      const callee = node.callee;
      if (
        callee.type !== 'MemberExpression' ||
        callee.object.name !== 'ReactDOM' ||
        callee.property.name !== 'render'
      ) {
        return;
      }

      const itParent = findParent(
        node,
        n =>
          n.type === 'CallExpression' &&
          n.callee.type == 'Identifier' &&
          // $FlowFixMe[prop-missing]
          n.callee.name === 'it'
      );
      if (itParent != null) {
        if (itParent.type !== 'CallExpression') {
          throw new Error('expected CallExpression');
        }
        if (updated.has(itParent)) {
          return;
        }
        updated.add(itParent);
        if (
          itParent.arguments.length === 2 &&
          itParent.arguments[1].type === 'FunctionExpression'
        ) {
          const fn = itParent.arguments[1];
          context.replaceNode(
            itParent.arguments[1],
            t.ArrowFunctionExpression({
              params: [],
              body: fn.body,
              async: false,
            })
          );
        }
      }
    },
  };
}

function findParent(node: ESNode, cond: ESNode => boolean): ?ESNode {
  let parent = node;
  while (parent != null) {
    if (cond(parent)) {
      return parent;
    }
    parent = parent.parent;
  }
  return null;
}

async function transformFile(filename: string) {
  const originalCode = readFileSync(filename, 'utf8');
  const transformedCode = await transform(
    originalCode,
    createVisitors,
    prettierOptions
  );
  writeFileSync(filename, transformedCode, 'utf8');
}

async function main() {
  const files = Glob.sync('packages/**/*-test.js');
  for (const file of files) {
    console.log(`transforming ${file}`);
    await transformFile(file);
  }
}

main().then(
  () => console.log('done'),
  err => console.error(err)
);
