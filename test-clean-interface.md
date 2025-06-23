# Test Clean Workflow Interface

This is a test file to verify our clean workflow dispatcher architecture
provides:

- Single "✅ CI Build" status check (unified for both build and release
  validation)
- Minimal dispatcher routing (not cluttering the interface)
- Proper linking to actual workflow runs

The old interface showed 8+ individual job checkmarks. The new interface should
show just 1-2 clean pipeline statuses.
