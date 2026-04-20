#!/bin/sh
# Azure App Service Linux often runs `node index.js` and repackages node_modules into
# a tarball that may omit `node_modules/.prisma`. Regenerate the client before boot.
set -e
cd "$(dirname "$0")"
export PATH="$PWD/node_modules/.bin:$PATH"
prisma generate
exec node index.js
