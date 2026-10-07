-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  wallet_balance DECIMAL(15,2) DEFAULT 1000.00,
  total_bets DECIMAL(15,2) DEFAULT 0,
  total_winnings DECIMAL(15,2) DEFAULT 0,
  win_rate FLOAT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game Rounds Table
CREATE TABLE game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number BIGINT UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, betting, processing, completed
  prediction_tai_prob FLOAT DEFAULT 50,
  prediction_xiu_prob FLOAT DEFAULT 50,
  ai_confidence FLOAT DEFAULT 50,
  actual_result VARCHAR(10), -- TAI or XIU
  prediction_result VARCHAR(10), -- AI prediction
  is_ai_correct BOOLEAN,
  total_bets_tai DECIMAL(15,2) DEFAULT 0,
  total_bets_xiu DECIMAL(15,2) DEFAULT 0,
  total_amount_wagered DECIMAL(15,2) DEFAULT 0,
  pattern_type VARCHAR(50), -- TRENDING, CHOPPY, RANDOM
  indicators JSONB,
  house_profit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  closed_at TIMESTAMP,
  result_announced_at TIMESTAMP
);

-- Bets Table
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
  bet_type VARCHAR(10) NOT NULL, -- TAI or XIU
  amount DECIMAL(15,2) NOT NULL,
  odds FLOAT DEFAULT 1.97,
  status VARCHAR(20) DEFAULT 'pending', -- pending, won, lost, cancelled
  payout DECIMAL(15,2),
  profit DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settled_at TIMESTAMP
);

-- AI Signals Table
CREATE TABLE ai_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES game_rounds(id) ON DELETE CASCADE,
  prediction VARCHAR(10) NOT NULL, -- TAI or XIU
  confidence FLOAT NOT NULL,
  pattern_type VARCHAR(50),
  technical_indicators JSONB,
  model_version VARCHAR(20),
  processing_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions Table
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_id UUID REFERENCES bets(id),
  transaction_type VARCHAR(20) NOT NULL, -- bet, win, deposit, withdraw
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_game_rounds_status ON game_rounds(status);
CREATE INDEX idx_game_rounds_round_number ON game_rounds(round_number DESC);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_round_id ON bets(round_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_ai_signals_round_id ON ai_signals(round_id);
