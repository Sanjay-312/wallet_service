import { Injectable, Logger, ConflictException, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../entities/transaction.entity';
import { Ledger } from '../entities/ledger.entity';
import { User } from '../entities/user.entity';
import { AssetType } from '../entities/asset-type.entity';
import { Balance } from '../entities/balance.entity';
import { WalletService } from './wallet.service';

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(Ledger)
    private readonly ledgerRepository: Repository<Ledger>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AssetType)
    private readonly assetRepository: Repository<AssetType>,
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
    private readonly walletService: WalletService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Process a wallet top-up transaction
   * Idempotent operation - same idempotency key returns same result
   */
  async topupWallet(
    userId: string,
    assetSymbol: string,
    amount: number,
    idempotencyKey: string,
    metadata?: Record<string, any>,
  ): Promise<Transaction> {
    try {
      // Check for duplicate transaction
      const existingTransaction = await this.transactionRepository.findOne({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        this.logger.warn(`Duplicate topup detected for key: ${idempotencyKey}`);
        return existingTransaction;
      }

      return await this.dataSource.transaction(async (manager) => {
      // Get system account (treasury)
      const systemAccount = await manager.findOne(User, {
        where: { walletType: 'system' },
      });

      if (!systemAccount) {
        throw new Error('System account not found');
      }

      // Get asset type
      const asset = await manager.findOne(AssetType, {
        where: { symbol: assetSymbol },
      });

      if (!asset) {
        throw new Error(`Asset ${assetSymbol} not found`);
      }

      // Get user
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Create transaction record
      const transaction = manager.create(Transaction, {
        fromUser: systemAccount,
        toUser: user,
        asset,
        type: 'TOPUP',
        amount,
        status: 'PENDING',
        idempotencyKey,
        metadata: JSON.stringify(metadata || {}),
      });

      await manager.save(transaction);

      // Get or create balance with pessimistic lock
      let balance = await manager
        .createQueryBuilder(Balance, 'balance')
        .setLock('pessimistic_write')
        .where('balance.user_id = :userId', { userId })
        .andWhere('balance.asset_id = :assetId', { assetId: asset.id })
        .getOne();

      if (!balance) {
        balance = manager.create(Balance, {
          user,
          asset,
          amount: 0,
          lockedAmount: 0,
        });
      }

      const previousBalance = Number(balance.amount) || 0;
      const topupAmount = Number(amount) || 0;
      balance.amount = previousBalance + topupAmount;
      await manager.save(balance);

      // Record ledger entries (double-entry bookkeeping)
      // Debit from system, credit to user (tracking only - system balance not deducted)
      const systemLedger = manager.create(Ledger, {
        user: systemAccount,
        asset,
        transactionType: 'TOPUP',
        direction: 'DEBIT',
        amount,
        balanceAfter: 0, // Tracking only, system balance unchanged
        status: 'COMPLETED',
        idempotencyKey: `${idempotencyKey}-system`,
        description: `Topup issued to ${user.email}`,
        transactionReference: transaction.id,
      });

      const userLedger = manager.create(Ledger, {
        user,
        asset,
        transactionType: 'TOPUP',
        direction: 'CREDIT',
        amount,
        balanceAfter: balance.amount,
        status: 'COMPLETED',
        idempotencyKey,
        description: `Topup received from system`,
        transactionReference: transaction.id,
      });

      await manager.save([systemLedger, userLedger]);

      // Update transaction status
      transaction.status = 'COMPLETED';
      transaction.completedAt = new Date();
      await manager.save(transaction);

      this.logger.log(
        `Topup completed: User ${userId}, Asset ${assetSymbol}, Amount ${amount}`,
      );

        return transaction;
      });
    } catch (err: any) {
      this.logger.error(`topupWallet failed: ${err?.message || err}`, err?.stack || err);
      if (err instanceof NotFoundException) throw err;
      if (err.message && err.message.includes('not found')) throw new NotFoundException(err.message);
      throw new InternalServerErrorException('Failed to process topup');
    }
  }

  /**
   * Issue bonus/incentive credits
   * Idempotent operation
   */
  async issueBonus(
    userId: string,
    assetSymbol: string,
    amount: number,
    idempotencyKey: string,
    reason?: string,
  ): Promise<Transaction> {
    try {
      // Check for duplicate
      const existingTransaction = await this.transactionRepository.findOne({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        this.logger.warn(`Duplicate bonus detected for key: ${idempotencyKey}`);
        return existingTransaction;
      }

      return await this.dataSource.transaction(async (manager) => {
      const systemAccount = await manager.findOne(User, {
        where: { walletType: 'system' },
      });

      if (!systemAccount) {
        throw new Error('System account not found');
      }

      const asset = await manager.findOne(AssetType, {
        where: { symbol: assetSymbol },
      });

      if (!asset) {
        throw new Error(`Asset ${assetSymbol} not found`);
      }

      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Create transaction
      const transaction = manager.create(Transaction, {
        fromUser: systemAccount,
        toUser: user,
        asset,
        type: 'BONUS',
        amount,
        status: 'PENDING',
        idempotencyKey,
        metadata: JSON.stringify({ reason }),
      });

      await manager.save(transaction);

      // Update balance with lock
      let balance = await manager
        .createQueryBuilder(Balance, 'balance')
        .setLock('pessimistic_write')
        .where('balance.user_id = :userId', { userId })
        .andWhere('balance.asset_id = :assetId', { assetId: asset.id })
        .getOne();

      if (!balance) {
        balance = manager.create(Balance, {
          user,
          asset,
          amount: 0,
          lockedAmount: 0,
        });
      }

      const previousBalance = Number(balance.amount) || 0;
      const bonusAmount = Number(amount) || 0;
      balance.amount = previousBalance + bonusAmount;
      await manager.save(balance);

      // Record ledger entries (tracking only - system balance not deducted)
      const systemLedger = manager.create(Ledger, {
        user: systemAccount,
        asset,
        transactionType: 'BONUS',
        direction: 'DEBIT',
        amount,
        balanceAfter: 0, // Tracking only, system balance unchanged
        status: 'COMPLETED',
        idempotencyKey: `${idempotencyKey}-system`,
        description: `Bonus issued to ${user.email}`,
        transactionReference: transaction.id,
      });

      const userLedger = manager.create(Ledger, {
        user,
        asset,
        transactionType: 'BONUS',
        direction: 'CREDIT',
        amount,
        balanceAfter: balance.amount,
        status: 'COMPLETED',
        idempotencyKey,
        description: `Bonus: ${reason || 'No reason provided'}`,
        transactionReference: transaction.id,
      });

      await manager.save([systemLedger, userLedger]);

      transaction.status = 'COMPLETED';
      transaction.completedAt = new Date();
      await manager.save(transaction);

        this.logger.log(`Bonus issued: User ${userId}, Asset ${assetSymbol}, Amount ${amount}`);

        return transaction;
      });
    } catch (err: any) {
      this.logger.error(`issueBonus failed: ${err?.message || err}`, err?.stack || err);
      if (err.message && err.message.includes('not found')) throw new NotFoundException(err.message);
      throw new InternalServerErrorException('Failed to issue bonus');
    }
  }

  /**
   * Process a spend transaction (user spends credits)
   * Idempotent operation
   */
  async spendCredits(
    userId: string,
    assetSymbol: string,
    amount: number,
    idempotencyKey: string,
    description?: string,
  ): Promise<Transaction> {
    try {
      // Check for duplicate
      const existingTransaction = await this.transactionRepository.findOne({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        this.logger.warn(`Duplicate spend detected for key: ${idempotencyKey}`);
        return existingTransaction;
      }

      return await this.dataSource.transaction(async (manager) => {
      const systemAccount = await manager.findOne(User, {
        where: { walletType: 'system' },
      });

      if (!systemAccount) {
        throw new Error('System account not found');
      }

      const asset = await manager.findOne(AssetType, {
        where: { symbol: assetSymbol },
      });

      if (!asset) {
        throw new Error(`Asset ${assetSymbol} not found`);
      }

      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Create transaction
      const transaction = manager.create(Transaction, {
        fromUser: user,
        toUser: systemAccount,
        asset,
        type: 'SPEND',
        amount,
        status: 'PENDING',
        idempotencyKey,
      });

      await manager.save(transaction);

      // Get balance with lock and validate
      const balance = await manager
        .createQueryBuilder(Balance, 'balance')
        .setLock('pessimistic_write')
        .where('balance.user_id = :userId', { userId })
        .andWhere('balance.asset_id = :assetId', { assetId: asset.id })
        .getOne();

        if (!balance || balance.amount < amount) {
          transaction.status = 'FAILED';
          transaction.errorMessage = 'Insufficient balance';
          await manager.save(transaction);
          throw new BadRequestException('Insufficient balance');
        }

      // balance.amount -= amount;
      // await manager.save(balance);
      const previousBalance = Number(balance.amount) || 0;
      const spendAmount = Number(amount) || 0;
      balance.amount = previousBalance - spendAmount;
      await manager.save(balance);

      // Record ledger entries (tracking only - system balance not added)
      const userLedger = manager.create(Ledger, {
        user,
        asset,
        transactionType: 'SPEND',
        direction: 'DEBIT',
        amount,
        balanceAfter: balance.amount,
        status: 'COMPLETED',
        idempotencyKey,
        description: description || 'Credit spent',
        transactionReference: transaction.id,
      });

      const systemLedger = manager.create(Ledger, {
        user: systemAccount,
        asset,
        transactionType: 'SPEND',
        direction: 'CREDIT',
        amount,
        balanceAfter: 0, // Tracking only, system balance unchanged
        status: 'COMPLETED',
        idempotencyKey: `${idempotencyKey}-system`,
        description: `Credits spent by ${user.email}`,
        transactionReference: transaction.id,
      });

      await manager.save([userLedger, systemLedger]);

      transaction.status = 'COMPLETED';
      transaction.completedAt = new Date();
      await manager.save(transaction);

        this.logger.log(`Spend completed: User ${userId}, Asset ${assetSymbol}, Amount ${amount}`);

        return transaction;
      });
    } catch (err: any) {
      this.logger.error(`spendCredits failed: ${err?.message || err}`, err?.stack || err);
      if (err instanceof BadRequestException) throw err;
      if (err.message && err.message.includes('not found')) throw new NotFoundException(err.message);
      throw new InternalServerErrorException('Failed to process spend');
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userId: string, limit = 50, offset = 0): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.find({
        where: [
          { fromUser: { id: userId } },
          { toUser: { id: userId } },
        ],
        relations: ['fromUser', 'toUser', 'asset'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });
    } catch (err: any) {
      this.logger.error(`getTransactionHistory failed: ${err?.message || err}`, err?.stack || err);
      throw new InternalServerErrorException('Failed to load transaction history');
    }
  }

  /**
   * Get ledger entries for a user
   */
  async getLedgerEntries(
    userId: string,
    assetId?: string,
    limit = 100,
    offset = 0,
  ): Promise<Ledger[]> {
    try {
      const query = this.ledgerRepository
        .createQueryBuilder('ledger')
        .where('ledger.user_id = :userId', { userId });

      if (assetId) {
        query.andWhere('ledger.asset_id = :assetId', { assetId });
      }

      return await query
        .orderBy('ledger.createdAt', 'DESC')
        .take(limit)
        .skip(offset)
        .getMany();
    } catch (err: any) {
      this.logger.error(`getLedgerEntries failed: ${err?.message || err}`, err?.stack || err);
      throw new InternalServerErrorException('Failed to load ledger entries');
    }
  }

  /**
   * Calculate balance for a user-asset pair during transaction
   */
  private async calculateUserAssetBalance(
    manager: any,
    userId: string,
    assetId: string,
  ): Promise<number> {
    const balance = await manager.findOne(Balance, {
      where: {
        user: { id: userId },
        asset: { id: assetId },
      },
    });

    return balance?.amount || 0;
  }
}
