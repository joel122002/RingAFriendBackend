CREATE DATABASE ringafriend;
\c ringafriend
CREATE SCHEMA main
CREATE TABLE main.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  hashed_password BYTEA NOT NULL,
  salt BYTEA NOT NULL,
  join_date TIMESTAMP NOT NULL
);

CREATE TABLE main.user_devices (
  user_id uuid REFERENCES main.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device_name VARCHAR(255) NOT NULL
);
