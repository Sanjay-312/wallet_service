import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LedgerService } from '../services/ledger.service';
import { WalletService } from '../services/wallet.service';
import {
  TopupWalletDto,
  IssueBonusDto,
  SpendCreditsDto,
  GetBalanceDto,
} from '../dtos/wallet.dto';

@Controller('api/v1/wallet')
export class WalletController {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Topup wallet - Purchase credits
   */
  @Post('topup')
  @HttpCode(HttpStatus.CREATED)
  async topupWallet(@Body() dto: TopupWalletDto) {
    const transaction = await this.ledgerService.topupWallet(
      dto.userId,
      dto.assetSymbol,
      dto.amount,
      dto.idempotencyKey,
      dto.metadata,
    );

    return {
      success: true,
      message: 'Wallet topup successful',
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
      },
    };
  }

  /**
   * Issue bonus - Add free credits
   */
  @Post('bonus')
  @HttpCode(HttpStatus.CREATED)
  async issueBonus(@Body() dto: IssueBonusDto) {
    const transaction = await this.ledgerService.issueBonus(
      dto.userId,
      dto.assetSymbol,
      dto.amount,
      dto.idempotencyKey,
      dto.reason,
    );

    return {
      success: true,
      message: 'Bonus issued successfully',
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
      },
    };
  }

  /**
   * Spend credits - User purchases something
   */
  @Post('spend')
  @HttpCode(HttpStatus.CREATED)
  async spendCredits(@Body() dto: SpendCreditsDto) {
    const transaction = await this.ledgerService.spendCredits(
      dto.userId,
      dto.assetSymbol,
      dto.amount,
      dto.idempotencyKey,
      dto.description,
    );

    return {
      success: true,
      message: 'Credits spent successfully',
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
      },
    };
  }

  /**
   * Get balance for user-asset pair
   */
  @Get('balance/:userId/:assetSymbol')
  async getBalance(
    @Param('userId') userId: string,
    @Param('assetSymbol') assetSymbol: string,
  ) {
    // First, get asset ID from symbol
    const balance = await this.walletService.getBalance(userId, assetSymbol);

    return {
      success: true,
      data: {
        userId,
        assetSymbol,
        balance,
      },
    };
  }

  /**
   * Get all balances for a user
   */
  @Get('balances/:userId')
  async getUserBalances(@Param('userId') userId: string) {
    const balances = await this.walletService.getUserBalances(userId);

    return {
      success: true,
      data: {
        userId,
        balances: balances.map((b) => ({
          assetSymbol: b.asset.symbol,
          amount: b.amount,
          lockedAmount: b.lockedAmount,
          availableAmount: b.amount - b.lockedAmount,
        })),
      },
    };
  }

  /**
   * Get transaction history
   */
  @Get('transactions/:userId')
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    const transactions = await this.ledgerService.getTransactionHistory(
      userId,
      parseInt(String(limit), 10),
      parseInt(String(offset), 10),
    );

    return {
      success: true,
      data: {
        userId,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          status: t.status,
          assetSymbol: t.asset.symbol,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
        })),
      },
    };
  }

  /**
   * Get ledger entries for auditability
   */
  @Get('ledger/:userId')
  async getLedgerEntries(
    @Param('userId') userId: string,
    @Query('assetId') assetId?: string,
    @Query('limit') limit = 100,
    @Query('offset') offset = 0,
  ) {
    const entries = await this.ledgerService.getLedgerEntries(
      userId,
      assetId,
      parseInt(String(limit), 10),
      parseInt(String(offset), 10),
    );

    return {
      success: true,
      data: {
        userId,
        entries: entries.map((e) => ({
          id: e.id,
          transactionType: e.transactionType,
          direction: e.direction,
          amount: e.amount,
          balanceAfter: e.balanceAfter,
          status: e.status,
          description: e.description,
          createdAt: e.createdAt,
        })),
      },
    };
  }
}
