build:
    pnpm run build

cleanup:
    rm -rf dist

purge:
    rm -rf dist node_modules pnpm-lock.yaml

publish:
    npm publish --access=public

test:
    pnpm run test

init:
    pnpm install