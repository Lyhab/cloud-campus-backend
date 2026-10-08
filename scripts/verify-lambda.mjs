import { access, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(projectRoot, 'dist-lambda');

process.env.NODE_ENV = 'production';
process.env.AWS_REGION ??= 'ap-southeast-2';
process.env.AWS_S3_BUCKET_NAME ??= 'lambda-package-test';
process.env.COGNITO_USER_POOL_ID ??= 'ap-southeast-2_lambdaPackageTest';
process.env.COGNITO_CLIENT_ID ??= 'lambda-package-test';
process.env.COGNITO_CLIENT_SECRET ??= 'lambda-package-test';
process.env.DATABASE_URL ??=
  'postgresql://lambda:lambda@localhost:5432/lambda_package_test';

await access(resolve(outputDirectory, 'lambda.mjs'));
await access(resolve(outputDirectory, 'global-bundle.pem'));
await access(
  resolve(outputDirectory, 'node_modules/swagger-ui-dist/absolute-path.js'),
);

const outputFiles = await readdir(outputDirectory, { recursive: true });
if (outputFiles.some((file) => file === '.env' || file.endsWith('/.env'))) {
  throw new Error('Lambda package must not contain a .env file.');
}

const { handler } = await import(
  pathToFileURL(resolve(outputDirectory, 'lambda.mjs'))
);

if (typeof handler !== 'function') {
  throw new Error('Lambda bundle does not export a handler function.');
}

if (handler.length !== 2) {
  throw new Error(
    `Node.js 24 requires an async two-argument handler; received ${handler.length} arguments.`,
  );
}

function createEvent(path) {
  return {
    version: '2.0',
    routeKey: `GET ${path}`,
    rawPath: path,
    rawQueryString: '',
    headers: {
      host: 'localhost',
      'user-agent': 'lambda-package-test',
    },
    requestContext: {
      accountId: 'test',
      apiId: 'test',
      domainName: 'localhost',
      domainPrefix: 'localhost',
      http: {
        method: 'GET',
        path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'lambda-package-test',
      },
      requestId: `test-${path}`,
      routeKey: `GET ${path}`,
      stage: '$default',
      time: '',
      timeEpoch: 0,
    },
    isBase64Encoded: false,
  };
}

for (const path of [
  '/',
  '/api/docs',
  '/api/docs/',
  '/api/docs/swagger-ui-bundle.js',
]) {
  const response = await handler(createEvent(path), {});

  if (response.statusCode !== 200) {
    throw new Error(
      `Lambda package smoke test failed for ${path}: ${response.statusCode}`,
    );
  }
}

console.log('Lambda package smoke test passed.');
