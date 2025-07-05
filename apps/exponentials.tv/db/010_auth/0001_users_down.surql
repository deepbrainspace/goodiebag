-- Migration: users
-- Module: 010_auth
-- Number: 0001
-- Created: Starter template for user authentication

-- Rollback User Authentication System
-- Uncomment to remove user authentication:

-- Remove user-role relationships
-- REMOVE TABLE user_role;

-- Remove roles
-- REMOVE TABLE role;

-- Remove users (WARNING: This will delete all user data!)
-- REMOVE TABLE user;