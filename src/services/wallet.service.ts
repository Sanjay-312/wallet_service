import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { AssetType } from '../entities/asset-type.entity';
import { Balance } from '../entities/balance.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AssetType)
    private readonly assetRepository: Repository<AssetType>,
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get or create a balance record for a user and asset
   * Uses row-level locking to prevent race conditions
   */
  async getBalanceWithLock(userId: string, assetId: string): Promise<Balance> {
    const balance = await this.balanceRepository
      .createQueryBuilder('balance')
      .setLock('pessimistic_write')
      .where('balance.user_id = :userId', { userId })
      .andWhere('balance.asset_id = :assetId', { assetId })
      .leftJoinAndSelect('balance.user', 'user')
      .leftJoinAndSelect('balance.asset', 'asset')
      .getOne();

    if (balance) {
      return balance;
    }

    // Create new balance if doesn't exist
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });

    if (!user || !asset) {
      throw new Error('User or Asset not found');
    }

    const newBalance = this.balanceRepository.create({
      user,
      asset,
      amount: 0,
      lockedAmount: 0,
    });

    return this.balanceRepository.save(newBalance);
  }

  /**
   * Get current balance without locking
   */
  async getBalance(userId: string, assetSymbol: string): Promise<number> {
    // Get asset type
      const asset = await this.assetRepository.findOne({
        where: { symbol: assetSymbol },
      });

      if (!asset) {
        throw new Error(`Asset ${assetSymbol} not found`);
      }
    const balance = await this.balanceRepository.findOne({
      where: {
        user: { id: userId },
        asset: { id: asset.id },
      },
    });

    return balance?.amount || 0;
  }

  /**
   * Get all balances for a user
   */
  async getUserBalances(userId: string): Promise<Balance[]> {
    return this.balanceRepository.find({
      where: { user: { id: userId } },
      relations: ['asset'],
    });
  }

  /**
   * Update balance atomically with row-level lock
   * Ensures no race conditions during concurrent updates
   */
  async updateBalanceWithLock(
    userId: string,
    assetId: string,
    amount: number,
    operation: 'add' | 'subtract',
  ): Promise<Balance> {
    return this.dataSource.transaction(async (manager) => {
      const balance = await manager
        .createQueryBuilder(Balance, 'balance')
        .setLock('pessimistic_write')
        .where('balance.user_id = :userId', { userId })
        .andWhere('balance.asset_id = :assetId', { assetId })
        .getOne();

      if (!balance) {
        throw new Error('Balance not found');
      }

      if (operation === 'subtract' && balance.amount < amount) {
        throw new Error('Insufficient balance');
      }

      const newAmount = operation === 'add' ? balance.amount + amount : balance.amount - amount;

      balance.amount = newAmount;
      return manager.save(balance);
    });
  }

  /**
   * Lock funds in a transaction
   */
  async lockFunds(userId: string, assetId: string, amount: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const balance = await manager
        .createQueryBuilder(Balance, 'balance')
        .setLock('pessimistic_write')
        .where('balance.user_id = :userId', { userId })
        .andWhere('balance.asset_id = :assetId', { assetId })
        .getOne();

      if (!balance) {
        throw new Error('Balance not found');
      }

      if (balance.amount - balance.lockedAmount < amount) {
        throw new Error('Insufficient available balance');
      }

      balance.lockedAmount += amount;
      await manager.save(balance);
    });
  }

  /**
   * Unlock previously locked funds
   */
  async unlockFunds(userId: string, assetId: string, amount: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const balance = await manager
        .createQueryBuilder(Balance, 'balance')
        .setLock('pessimistic_write')
        .where('balance.user_id = :userId', { userId })
        .andWhere('balance.asset_id = :assetId', { assetId })
        .getOne();

      if (!balance) {
        throw new Error('Balance not found');
      }

      balance.lockedAmount = Math.max(0, balance.lockedAmount - amount);
      await manager.save(balance);
    });
  }
}
