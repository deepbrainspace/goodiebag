-- Migration: setup
-- Module: 000_admin
-- Number: 0001
-- Created: Starter template for database initialization

-- System Administration Setup

-- Always ensure namespace exists
DEFINE NAMESPACE `apps` IF NOT EXISTS;

-- Create environment databases
DEFINE DATABASE development ON NAMESPACE `apps` IF NOT EXISTS;
DEFINE DATABASE staging ON NAMESPACE `apps` IF NOT EXISTS;
DEFINE DATABASE production ON NAMESPACE `apps` IF NOT EXISTS;

-- Note: USE NS/DB commands added automatically by nx-surrealdb
-- based on SURREALDB_NAMESPACE and SURREALDB_DATABASE env vars

-- Create admin users and basic permissions
-- DEFINE USER admin ON ROOT PASSWORD 'CHANGE_THIS_PASSWORD' ROLES OWNER;

-- Define authentication scopes
-- DEFINE SCOPE user SESSION 24h
--   SIGNUP ( CREATE user SET email = $email, pass = crypto::argon2::generate($pass) )
--   SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass) );

-- Create system configuration table
-- DEFINE TABLE system_config SCHEMAFULL
--   PERMISSIONS FOR select, create, update, delete WHERE true;
-- DEFINE FIELD key ON system_config TYPE string;
-- DEFINE FIELD value ON system_config TYPE string;