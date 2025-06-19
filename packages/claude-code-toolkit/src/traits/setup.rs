//! Setup and configuration wizard traits

use crate::error::Result;
use crate::types::Config;
use async_trait::async_trait;
use std::collections::HashMap;

/// Context for setup wizard steps
#[derive(Debug, Default)]
pub struct SetupContext {
  pub config: Config,
  pub user_input: HashMap<String, String>,
  pub flags: HashMap<String, bool>,
  pub step_results: HashMap<String, String>,
}

impl SetupContext {
  pub fn new() -> Self {
    Self::default()
  }

  pub fn set_input(&mut self, key: &str, value: &str) {
    self.user_input.insert(key.to_string(), value.to_string());
  }

  pub fn get_input(&self, key: &str) -> Option<&String> {
    self.user_input.get(key)
  }

  pub fn set_flag(&mut self, key: &str, value: bool) {
    self.flags.insert(key.to_string(), value);
  }

  pub fn get_flag(&self, key: &str) -> bool {
    self.flags.get(key).copied().unwrap_or(false)
  }

  pub fn set_result(&mut self, step: &str, result: &str) {
    self.step_results.insert(step.to_string(), result.to_string());
  }

  pub fn get_result(&self, step: &str) -> Option<&String> {
    self.step_results.get(step)
  }
}

/// Individual setup step
#[async_trait]
pub trait SetupStep: Send + Sync {
  /// Get step identifier
  fn step_id(&self) -> &str;

  /// Get step description
  fn description(&self) -> &str;

  /// Check if step can be skipped
  fn can_skip(&self, _context: &SetupContext) -> bool {
    false
  }

  /// Check if step prerequisites are met
  async fn check_prerequisites(&self, context: &SetupContext) -> Result<bool>;

  /// Execute the setup step
  async fn execute(&self, context: &mut SetupContext) -> Result<()>;

  /// Validate step results
  async fn validate(&self, context: &SetupContext) -> Result<bool>;

  /// Get next step recommendations
  fn next_steps(&self, _context: &SetupContext) -> Vec<String> {
    Vec::new()
  }
}

/// Setup wizard orchestrator
#[async_trait]
pub trait SetupWizard: Send + Sync {
  /// Get wizard name
  fn wizard_name(&self) -> &str;

  /// Get all setup steps
  fn get_steps(&self) -> Vec<Box<dyn SetupStep>>;

  /// Run complete setup wizard
  async fn run_setup(&self) -> Result<Config>;

  /// Run specific steps
  async fn run_steps(&self, step_ids: &[&str]) -> Result<Config>;

  /// Get setup progress
  fn get_progress(&self, context: &SetupContext) -> f32;

  /// Handle setup errors
  async fn handle_error(
    &self,
    step: &dyn SetupStep,
    error: &crate::error::ClaudeCodeError,
    context: &mut SetupContext
  ) -> Result<bool>;
}
