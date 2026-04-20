#!/bin/sh
# Azure App Service Linux often runs `node index.js` and repackages node_modules into
# a tarball that may omit `node_modules/.prisma`. Regenerate the client before boot.
set -e
cd "$(dirname "$0")"
export PATH="$PWD/node_modules/.bin:$PATH"
# In App Service, node_modules may be unpacked without executable bits, so the
# `node_modules/.bin/prisma` shim can fail with "Permission denied".
node "$PWD/node_modules/prisma/build/index.js" generate
exec node index.js
