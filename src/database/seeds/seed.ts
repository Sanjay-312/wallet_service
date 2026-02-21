import { DataSource } from 'typeorm';
import { typeormConfig } from '../../config/typeorm.config';
import { User } from '../../entities/user.entity';
import { AssetType } from '../../entities/asset-type.entity';
import { Balance } from '../../entities/balance.entity';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const config = typeormConfig();
  const dataSource = new DataSource({
    ...config,
    synchronize: false,
    migrations: [],
  } as any);

  try {
    await dataSource.initialize();
    console.log('✓ Database connection established');

    // Create asset types
    const assetRepository = dataSource.getRepository(AssetType);
    const assetTypes = [
      {
        symbol: 'GOLD_COINS',
        name: 'Gold Coins',
        description: 'In-game premium currency',
        status: 'ACTIVE',
      },
      {
        symbol: 'DIAMONDS',
        name: 'Diamonds',
        description: 'Rare premium currency',
        status: 'ACTIVE',
      },
      {
        symbol: 'LOYALTY_POINTS',
        name: 'Loyalty Points',
        description: 'Earned through gameplay and achievements',
        status: 'ACTIVE',
      },
    ];

    for (const assetType of assetTypes) {
      const existing = await assetRepository.findOne({
        where: { symbol: assetType.symbol },
      });
      if (!existing) {
        await assetRepository.save(assetRepository.create(assetType));
        console.log(`✓ Created asset type: ${assetType.symbol}`);
      }
    }

    // Create system account
    const userRepository = dataSource.getRepository(User);
    let systemUser = await userRepository.findOne({
      where: { walletType: 'system' },
    });

    if (!systemUser) {
      systemUser = userRepository.create({
        email: 'system@wallet-service.local',
        name: 'System Treasury',
        walletType: 'system',
      });
      await userRepository.save(systemUser);
      console.log('✓ Created system account');
    }

    // Create regular users
    const users = [
      {
        email: 'user1@example.com',
        name: 'Alice Johnson',
        walletType: 'user',
      },
      {
        email: 'user2@example.com',
        name: 'Bob Smith',
        walletType: 'user',
      },
    ];

    const createdUsers: User[] = [];
    for (const userData of users) {
      const existing = await userRepository.findOne({
        where: { email: userData.email },
      });
      if (!existing) {
        const user = userRepository.create(userData);
        await userRepository.save(user);
        createdUsers.push(user);
        console.log(`✓ Created user: ${userData.email}`);
      } else {
        createdUsers.push(existing);
      }
    }

    // Initialize balances for users with all asset types
    const balanceRepository = dataSource.getRepository(Balance);
    const assets = await assetRepository.find();

    for (const user of createdUsers) {
      for (const asset of assets) {
        const existingBalance = await balanceRepository.findOne({
          where: { user: { id: user.id }, asset: { id: asset.id } },
        });

        if (!existingBalance) {
          const initialAmount =
            asset.symbol === 'GOLD_COINS'
              ? 1000
              : asset.symbol === 'DIAMONDS'
                ? 500
                : 5000;

          const balance = balanceRepository.create({
            user,
            asset,
            amount: initialAmount,
            lockedAmount: 0,
          });

          await balanceRepository.save(balance);
          console.log(
            `✓ Initialized ${user.email} with ${initialAmount} ${asset.symbol}`,
          );
        }
      }
    }

    // Initialize system account balances
    for (const asset of assets) {
      const existingBalance = await balanceRepository.findOne({
        where: { user: { id: systemUser.id }, asset: { id: asset.id } },
      });

      if (!existingBalance) {
        const balance = balanceRepository.create({
          user: systemUser,
          asset,
          amount: 1000000, // Large initial balance for system
          lockedAmount: 0,
        });

        await balanceRepository.save(balance);
        console.log(`✓ Initialized system account with ${asset.symbol}`);
      }
    }

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nInitial Setup Summary:');
    console.log('- Asset Types: 3 (Gold Coins, Diamonds, Loyalty Points)');
    console.log('- System Account: 1 (system@wallet-service.local)');
    console.log('- User Accounts: 2');
    console.log('  - user1@example.com (Alice Johnson)');
    console.log('  - user2@example.com (Bob Smith)');
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seed();
