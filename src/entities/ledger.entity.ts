import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { AssetType } from './asset-type.entity';

@Entity('ledger')
@Index('idx_ledger_user_asset', ['user', 'asset'])
@Index('idx_ledger_type_status', ['transactionType', 'status'])
@Index('idx_ledger_created', ['createdAt'])
export class Ledger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => AssetType, (asset) => asset.ledgers, { eager: true })
  @JoinColumn({ name: 'asset_id' })
  asset: AssetType;

  @Column({ type: 'varchar', length: 50, name: 'transaction_type' })
  transactionType: string; // 'TOPUP', 'BONUS', 'SPEND', 'TRANSFER', 'REVERSAL'

  @Column({ type: 'varchar', length: 50, name: 'direction' })
  direction: string; // 'DEBIT' or 'CREDIT'

  @Column({ type: 'bigint', name: 'amount' })
  amount: number;

  @Column({ type: 'bigint', nullable: true, name: 'balance_after' })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 50, default: 'COMPLETED', name: 'status' })
  status: string; // 'PENDING', 'COMPLETED', 'FAILED', 'REVERSED'

  @Column({ type: 'varchar', length: 255, unique: true, name: 'idempotencykey' })
  idempotencyKey: string; // for idempotency

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_reference' })
  transactionReference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
