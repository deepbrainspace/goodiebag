-- Migration: setup
-- Module: 000_admin
-- Number: 0001
-- Created: Starter template for database initialization

-- System Administration Setup
-- Uncomment and customize the following for your database:

-- Create admin users and basic permissions
-- DEFINE USER admin ON ROOT PASSWORD 'your-admin-password' ROLES OWNER;

-- Set up basic database structure
-- USE NS development;
-- USE DB main;

-- Define authentication scopes
-- DEFINE SCOPE user SESSION 24h
--   SIGNUP ( CREATE user SET email = $email, pass = crypto::argon2::generate($pass) )
--   SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass) );

-- Create system configuration table
-- DEFINE TABLE system_config SCHEMAFULL
--   PERMISSIONS FOR select, create, update, delete WHERE true;
-- DEFINE FIELD key ON system_config TYPE string;
-- DEFINE FIELD value ON system_config TYPE string;