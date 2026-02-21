import { DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { AssetType } from '../entities/asset-type.entity';
import { Balance } from '../entities/balance.entity';
import { Transaction } from '../entities/transaction.entity';
import { Ledger } from '../entities/ledger.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'sanjay',
  password: process.env.DB_PASSWORD || '306312',
  database: process.env.DB_NAME || 'wallet_service',
  entities: [User, AssetType, Balance, Transaction, Ledger],
  migrations: [path.join(__dirname, '..', 'migrations', '*.ts')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});