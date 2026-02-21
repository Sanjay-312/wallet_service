import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { User } from './user.entity';
import { AssetType } from './asset-type.entity';

@Entity('balances')
@Unique(['user', 'asset'])
@Index('idx_balance_user_asset', ['user', 'asset'])
export class Balance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.balances, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => AssetType, (asset) => asset.balances, { eager: true })
  @JoinColumn({ name: 'asset_id' })
  asset: AssetType;

  @Column({ type: 'bigint', default: 0, name: 'amount' })
  amount: number; // stored as integer to avoid floating point issues

  @Column({ type: 'bigint', default: 0, name: 'locked_amount' })
  lockedAmount: number; // amount locked in pending transactions

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'version' })
  version: string; // for optimistic locking
}
