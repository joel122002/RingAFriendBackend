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
