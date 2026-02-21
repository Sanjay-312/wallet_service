import { IsUUID, IsString, IsNumber, Min, IsOptional, IsObject } from 'class-validator';

export class TopupWalletDto {
  @IsUUID()
  userId: string;

  @IsString()
  assetSymbol: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  idempotencyKey: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class IssueBonusDto {
  @IsUUID()
  userId: string;

  @IsString()
  assetSymbol: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SpendCreditsDto {
  @IsUUID()
  userId: string;

  @IsString()
  assetSymbol: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  idempotencyKey: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GetBalanceDto {
  @IsUUID()
  userId: string;

  @IsString()
  assetSymbol: string;
}
