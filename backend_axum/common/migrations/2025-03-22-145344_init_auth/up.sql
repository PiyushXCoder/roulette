-- Your SQL goes here
CREATE TABLE IF NOT EXISTS player (
  email TEXT NOT NULL UNIQUE,
  fullname TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  modified_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,

  PRIMARY KEY(email)
);

CREATE TABLE IF NOT EXISTS session_type (
  id UUID,
  name TEXT,
  created_at TIMESTAMP NOT NULL,
  modified_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,

  PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS session (
  id UUID,
  player_id TEXT,
  session_type_id UUID,
  token TEXT,
  created_at TIMESTAMP NOT NULL,
  modified_at TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,

  FOREIGN KEY(player_id) REFERENCES player(email),
  FOREIGN KEY(session_type_id) REFERENCES session_type(id),
  PRIMARY KEY(id)
);
