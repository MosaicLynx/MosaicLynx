import * as SQLite from 'expo-sqlite';

import { type MobilePersistedState, emptyMobileState } from './model';

const DB_NAME = 'mosaiclynx-testnet.db';
const STATE_KEY = 'mobile-state-v1';

export class MobileRepository {
  private database?: SQLite.SQLiteDatabase;

  private async db(): Promise<SQLite.SQLiteDatabase> {
    this.database ??= await SQLite.openDatabaseAsync(DB_NAME);
    await this.database.execAsync(
      'PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);'
    );
    return this.database;
  }

  public async load(language: 'ja' | 'en'): Promise<MobilePersistedState> {
    const row = await (
      await this.db()
    ).getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key = ?', STATE_KEY);
    if (!row) return emptyMobileState(language);
    const state = JSON.parse(row.value) as MobilePersistedState;
    if (
      state.schemaVersion !== 1 ||
      !Array.isArray(state.profiles) ||
      state.profiles.some((profile) => profile.network !== 'testnet')
    )
      throw new Error('UNSUPPORTED_STORE');
    return state;
  }

  public async save(state: MobilePersistedState): Promise<void> {
    if (state.profiles.some((profile) => profile.network !== 'testnet')) throw new Error('MAINNET_DISABLED');
    const database = await this.db();
    await database.withTransactionAsync(async () => {
      await database.runAsync(
        'INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)',
        STATE_KEY,
        JSON.stringify(state)
      );
    });
  }
}
