import { configure as serverlessExpress } from '@codegenie/serverless-express';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';

import { AppModule } from './app.module';
import { setupApp } from './app.setup';

type AsyncHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
) => Promise<APIGatewayProxyStructuredResultV2>;

let cachedHandler: AsyncHandler | undefined;

async function bootstrap(): Promise<AsyncHandler> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  setupApp(app);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();

  return serverlessExpress<
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2
  >({ app: expressApp }) as unknown as AsyncHandler;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  cachedHandler ??= await bootstrap();

  return cachedHandler(event, context);
};
