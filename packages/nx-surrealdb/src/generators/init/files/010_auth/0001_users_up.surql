-- Migration: users
-- Module: 010_auth
-- Number: 0001
-- Created: Starter template for user authentication

-- User Authentication System
-- Uncomment and customize for your user management needs:

-- Create users table
-- DEFINE TABLE user SCHEMAFULL
--   PERMISSIONS 
--     FOR select, update WHERE id = $auth.id
--     FOR create, delete WHERE false;

-- User fields
-- DEFINE FIELD email ON user TYPE string;
-- DEFINE FIELD pass ON user TYPE string;
-- DEFINE FIELD name ON user TYPE string;
-- DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now();
-- DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now();

-- User indexes
-- DEFINE INDEX email_idx ON user COLUMNS email UNIQUE;

-- Create roles table
-- DEFINE TABLE role SCHEMAFULL;
-- DEFINE FIELD name ON role TYPE string;
-- DEFINE FIELD permissions ON role TYPE array;

-- User-role relationship
-- DEFINE TABLE user_role SCHEMAFULL;
-- DEFINE FIELD user ON user_role TYPE record(user);
-- DEFINE FIELD role ON user_role TYPE record(role);