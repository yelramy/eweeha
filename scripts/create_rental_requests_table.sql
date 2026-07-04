-- Create rental_requests table for flexible booking intent capture

CREATE TABLE IF NOT EXISTS rental_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_type TEXT NOT NULL,
  pickup_date TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  starting_location TEXT NOT NULL,
  passengers INTEGER NOT NULL DEFAULT 1,
  phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  quoted_price REAL,
  quoted_at TEXT,
  confirmed_at TEXT,
  requested_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_rental_requests_status ON rental_requests(status);
CREATE INDEX IF NOT EXISTS idx_rental_requests_pickup_date ON rental_requests(pickup_date);
CREATE INDEX IF NOT EXISTS idx_rental_requests_phone ON rental_requests(phone);

