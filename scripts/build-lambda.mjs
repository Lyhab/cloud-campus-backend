import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

import { build } from 'esbuild';

const projectRoot = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(projectRoot, 'dist-lambda');
const outputArchive = resolve(projectRoot, 'cloud-campus-backend-lambda.zip');

await rm(outputDirectory, { recursive: true, force: true });
await rm(outputArchive, { force: true });
await mkdir(outputDirectory, { recursive: true });

await build({
  entryPoints: [resolve(projectRoot, 'scripts/lambda-entry.mjs')],
  outfile: resolve(outputDirectory, 'lambda.mjs'),
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  sourcemap: true,
  banner: {
    js: 'import { createRequire as __lambdaCreateRequire } from "node:module"; const require = __lambdaCreateRequire(import.meta.url);',
  },
  external: [
    '@nestjs/microservices',
    '@nestjs/microservices/*',
    '@nestjs/websockets/*',
    'class-transformer',
    'class-validator',
  ],
});

await copyFile(
  resolve(projectRoot, 'global-bundle.pem'),
  resolve(outputDirectory, 'global-bundle.pem'),
);

await cp(
  resolve(projectRoot, 'node_modules/swagger-ui-dist'),
  resolve(outputDirectory, 'node_modules/swagger-ui-dist'),
  { recursive: true },
);
