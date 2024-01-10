#!/bin/bash -e
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

THIS_DIR=$(cd "${BASH_SOURCE[0]%/*}" && pwd)
ROOT_DIR=$(cd "${THIS_DIR}/../.." && pwd)

cd "$ROOT_DIR"
node_modules/.bin/flow-node "$THIS_DIR/index.js"
