import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { AssetType } from './asset-type.entity';

@Entity('transactions')
@Index('idx_transaction_status', ['status'])
@Index('idx_transaction_created', ['createdAt'])
@Index('idx_transaction_reference', ['transactionReference'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.transactionsFrom)
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.transactionsTo)
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;

  @ManyToOne(() => AssetType, { eager: true })
  @JoinColumn({ name: 'asset_id' })
  asset: AssetType;

  @Column({ type: 'varchar', length: 50, name: 'type' })
  type: string; // 'TOPUP', 'BONUS', 'SPEND', 'TRANSFER'

  @Column({ type: 'bigint', name: 'amount' })
  amount: number;

  @Column({ type: 'varchar', length: 50, default: 'PENDING', name: 'status' })
  status: string; // 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'

  @Column({ type: 'varchar', length: 255, unique: true, name: 'idempotencykey' })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'transaction_reference' })
  transactionReference: string;

  @Column({ type: 'text', nullable: true, name: 'metadata' })
  metadata: string; // JSON stringified

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;
}
