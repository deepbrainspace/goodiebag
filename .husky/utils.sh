#!/bin/bash
# Shared utility functions for husky hooks

# Color output functions
info() {
  printf "\033[36m[i]\033[0m %s\n" "$1"
}

success() {
  printf "\033[32m[✓]\033[0m %s\n" "$1"
}

error() {
  printf "\033[31m[✗]\033[0m %s\n" "$1"
}

warning() {
  printf "\033[33m[!]\033[0m %s\n" "$1"
}

tip() {
  printf "\033[36m[?]\033[0m %s\n" "$1"
}

fix() {
  printf "\033[33m[🔧]\033[0m %s\n" "$1"
}

stop() {
  printf "\033[31m[■]\033[0m %s\n" "$1"
}

# Debug function - only outputs when HUSKY_DEBUG=1
debug_echo() {
  if [ "${HUSKY_DEBUG:-0}" = "1" ]; then
    info "DEBUG: $1"
  fi
}