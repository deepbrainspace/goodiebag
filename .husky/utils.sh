#!/bin/bash
# Shared utility functions for husky hooks
# Inspired by lint-staged's polished output design

# Professional status symbols and colors (lint-staged style)
info() {
  printf "\033[36mℹ\033[0m %s\n" "$1"
}

success() {
  printf "\033[32m✔\033[0m %s\n" "$1"
}

error() {
  printf "\033[31m✖\033[0m %s\n" "$1"
}

warning() {
  printf "\033[33m⚠\033[0m %s\n" "$1"
}

skip() {
  printf "\033[33m↩\033[0m %s\n" "$1"
}

pointer() {
  printf "\033[33m❯\033[0m %s\n" "$1"
}

# Legacy aliases for backward compatibility
tip() {
  info "$1"
}

fix() {
  warning "$1"
}

stop() {
  error "$1"
}

# Debug function - only outputs when HUSKY_DEBUG=1
debug_echo() {
  if [ "${HUSKY_DEBUG:-0}" = "1" ]; then
    info "DEBUG: $1"
  fi
}