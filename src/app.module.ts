import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { WalletController } from './controllers/wallet.controller';
import { HealthController } from './controllers/health.controller';
import { WalletService } from './services/wallet.service';
import { LedgerService } from './services/ledger.service';
import { typeormConfig } from './config/typeorm.config';
import { User } from './entities/user.entity';
import { AssetType } from './entities/asset-type.entity';
import { Balance } from './entities/balance.entity';
import { Ledger } from './entities/ledger.entity';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => typeormConfig(),
    }),
    TypeOrmModule.forFeature([User, AssetType, Balance, Ledger, Transaction]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
    }),
  ],
  controllers: [WalletController, HealthController],
  providers: [WalletService, LedgerService],
})
export class AppModule {}
