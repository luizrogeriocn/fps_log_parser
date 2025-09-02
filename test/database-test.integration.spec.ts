import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AppDataSource } from '../src/data-source';
import { Player } from "../src/match-domain/entities/player.entity"

describe('bla', () => {
  it('creates a player', async () => {
    const repo = AppDataSource.getRepository(Player);
    await repo.save({ name: 'Roger' });
    const users = await repo.find();
    expect(users).toHaveLength(1);
  });

  it('checks there are no players left', async () => {
    const repo = AppDataSource.getRepository(Player);
    const users = await repo.find();
    expect(users).toHaveLength(0);
  });
});
