DEFINE TABLE IF NOT EXISTS system_migrations SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS number ON system_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS name ON system_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS direction ON system_migrations TYPE string ASSERT $value IN ['up', 'down'] DEFAULT 'up';
DEFINE FIELD IF NOT EXISTS filename ON system_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS path ON system_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS content ON system_migrations TYPE string;
DEFINE FIELD IF NOT EXISTS module ON system_migrations TYPE string;

DEFINE FIELD IF NOT EXISTS namespace ON system_migrations TYPE string DEFAULT session::ns() ?? 'default';
DEFINE FIELD IF NOT EXISTS database ON system_migrations TYPE string DEFAULT session::db() ?? 'default';

DEFINE FIELD IF NOT EXISTS checksum ON system_migrations TYPE option<string>;
DEFINE FIELD IF NOT EXISTS status ON system_migrations TYPE string ASSERT $value IN ['success', 'fail'] DEFAULT 'success';
DEFINE FIELD IF NOT EXISTS applied_at ON system_migrations TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS applied_by ON system_migrations TYPE option<string> DEFAULT 'nx-plugin';
DEFINE FIELD IF NOT EXISTS execution_time_ms ON system_migrations TYPE option<int>;

DEFINE INDEX IF NOT EXISTS system_migrations_applied_at ON system_migrations FIELDS applied_at;