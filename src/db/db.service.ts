import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool: Pool;
  readonly db: NodePgDatabase;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.get<string>('DATABASE_URL'),
    });

    this.db = drizzle(this.pool);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
