variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "Australia East"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "zb-installer-rg"
}

variable "log_analytics_workspace_name" {
  description = "Log Analytics Workspace name"
  type        = string
  default     = "zb-installer-law"
}

variable "application_insights_name" {
  description = "Application Insights name"
  type        = string
  default     = "zb-installer-ai"
}

variable "key_vault_name" {
  description = "Key Vault name"
  type        = string
  default     = "zb-installer-kv"
}

variable "storage_account_name" {
  description = "Storage account name"
  type        = string
  default     = "zbinstallerstorage"
}

variable "storage_account_table_name" {
  description = "Storage account name for table"
  type        = string
  default     = "zbinstallertable"
}

variable "installations_table_name" {
  description = "Table name for storing GitHub App installation info"
  type        = string
  default     = "installations"
}

variable "tokens_table_name" {
  description = "Table name for storing GitHub OAuth App tokens"
  type        = string
  default     = "tokens"
}

variable "function_app_name" {
  description = "Function App name"
  type        = string
  default     = "zb-installer-app"
}

variable "github_app_id" {
  description = "GitHub App ID"
  type        = string
}

variable "oauth_client_id" {
  description = "GitHub OAuth App Client ID"
  type        = string
}

variable "allowed_origins" {
  description = "Allowed origin list for CORS, use comma to separate multiple origins"
  type        = string
  default     = ""
}

# Secrets - these will be stored in Key Vault, so we can mark them as sensitive and give them default empty values
variable "jwt_secret" {
  sensitive   = true
  description = "JWT secret"
  type        = string
  default     = "" # placeholder, should be overridden by next step, and will be stored in Key Vault
}
variable "oauth_secret" {
  sensitive   = true
  description = "OAuth secret"
  type        = string
  default     = "" # placeholder, should be overridden by next step, and will be stored in Key Vault
}
variable "github_app_private_key" {
  sensitive   = true
  description = "GitHub App private key"
  type        = string
  default     = "" # placeholder, should be overridden by next step, and will be stored in Key Vault
}
