import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletController } from "@/controllers/wallet.controller";
import { WalletService } from "@/services/wallet.service";
import { LedgerService } from "@/services/ledger.service";
import { Balance } from "@/entities/balance.entity";
import { AssetType } from "@/entities/asset-type.entity";
import { User } from "@/entities/user.entity";
import { Ledger } from "@/entities/ledger.entity";
import { Transaction } from "@/entities/transaction.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AssetType, Balance, Ledger, Transaction]),
  ],
  controllers: [WalletController],
  providers: [WalletService, LedgerService],
})
export class WalletModule {}
