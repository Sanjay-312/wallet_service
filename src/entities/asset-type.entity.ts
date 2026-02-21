import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Balance } from './balance.entity';
import { Ledger } from './ledger.entity';

@Entity('asset_types')
@Index('idx_asset_symbol', ['symbol'])
export class AssetType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'symbol' })
  symbol: string; // 'GOLD', 'DIAMONDS', 'LOYALTY_POINTS'

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE', name: 'status' })
  status: string; // 'ACTIVE', 'INACTIVE'

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Balance, (balance) => balance.asset)
  balances: Balance[];

  @OneToMany(() => Ledger, (ledger) => ledger.asset)
  ledgers: Ledger[];
}
