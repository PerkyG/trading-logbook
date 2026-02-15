import { sql } from '@vercel/postgres';

export async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS traders (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      pin_hash VARCHAR(255) NOT NULL,
      account_start DECIMAL(15,2) NOT NULL DEFAULT 10000,
      base_risk_pct DECIMAL(7,6) NOT NULL DEFAULT 0.005,
      risk_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.5,
      stepsize_up INT NOT NULL DEFAULT 30,
      target_ev DECIMAL(5,2) NOT NULL DEFAULT 0.4,
      gamification_enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      trader_id INT REFERENCES traders(id) NOT NULL,
      trade_number INT NOT NULL,
      ticker VARCHAR(30) NOT NULL,
      date_entry TIMESTAMP NOT NULL,
      date_exit TIMESTAMP,
      price_entry DECIMAL(15,6) NOT NULL,
      price_stop DECIMAL(15,6) NOT NULL,
      price_tp TEXT,
      price_exit DECIMAL(15,6),
      contracts DECIMAL(15,6) NOT NULL,
      multiplier DECIMAL(10,2) NOT NULL DEFAULT 1,
      trade_r DECIMAL(10,4),
      nett_r DECIMAL(10,4),
      sum_r DECIMAL(10,4),
      planned_risk_usd DECIMAL(15,2),
      usd_at_risk DECIMAL(15,2),
      risk_r_factor DECIMAL(5,2),
      pnl_usd DECIMAL(15,2),
      equity_before DECIMAL(15,2),
      equity_after DECIMAL(15,2),
      level INT DEFAULT 0,
      level_to_go INT DEFAULT 30,
      risk_pct DECIMAL(7,6),
      normal_risk_pct DECIMAL(7,6),
      power_norm DECIMAL(5,4),
      analysed BOOLEAN DEFAULT false,
      max_win_r DECIMAL(10,4),
      reason_for_loss TEXT,
      win_optimization TEXT,
      screenshots TEXT,
      tags TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(trader_id, trade_number)
    )
  `;
}

export { sql };
