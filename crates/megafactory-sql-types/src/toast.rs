use serde::{Deserialize, Serialize};

/// Toast notification level.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ToastLevel {
    Info,
    Success,
    Warning,
    Error,
}

/// A single toast notification message.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToastMessage {
    pub id: uuid::Uuid,
    pub message: String,
    pub level: ToastLevel,
    pub auto_dismiss_ms: u64,
}

impl ToastMessage {
    pub fn new(level: ToastLevel, message: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            message: message.into(),
            level,
            auto_dismiss_ms: 5000,
        }
    }
}
