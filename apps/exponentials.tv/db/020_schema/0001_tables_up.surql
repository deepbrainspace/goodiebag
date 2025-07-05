-- Migration: tables
-- Module: 020_schema
-- Number: 0001
-- Created: Starter template for application schema

-- Core Application Schema
-- Uncomment and customize for your application's data model:

-- Example: Create a posts table
-- DEFINE TABLE post SCHEMAFULL
--   PERMISSIONS
--     FOR select WHERE published = true OR author = $auth.id
--     FOR create, update, delete WHERE author = $auth.id;

-- DEFINE FIELD title ON post TYPE string;
-- DEFINE FIELD content ON post TYPE string;
-- DEFINE FIELD author ON post TYPE record(user);
-- DEFINE FIELD published ON post TYPE bool DEFAULT false;
-- DEFINE FIELD created_at ON post TYPE datetime DEFAULT time::now();
-- DEFINE FIELD updated_at ON post TYPE datetime DEFAULT time::now();

-- Example: Create a categories table
-- DEFINE TABLE category SCHEMAFULL;
-- DEFINE FIELD name ON category TYPE string;
-- DEFINE FIELD description ON category TYPE string;

-- Example: Post-category relationship
-- DEFINE TABLE post_category SCHEMAFULL;
-- DEFINE FIELD post ON post_category TYPE record(post);
-- DEFINE FIELD category ON post_category TYPE record(category);