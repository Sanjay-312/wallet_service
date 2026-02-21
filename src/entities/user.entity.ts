import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Unique, Index } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Balance } from './balance.entity';

@Entity('users')
@Index('idx_user_email', ['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'email' })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'user', name: 'wallet_type' })
  walletType: string; // 'user' or 'system'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Balance, (balance) => balance.user)
  balances: Balance[];

  @OneToMany(() => Transaction, (transaction) => transaction.fromUser)
  transactionsFrom: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.toUser)
  transactionsTo: Transaction[];
}
