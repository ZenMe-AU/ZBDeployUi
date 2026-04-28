
# =========================
# Resource Group
# =========================
resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}


# =========================
# Log Analytics Workspace + Application Insights
# =========================
resource "azurerm_log_analytics_workspace" "law" {
  name                = var.log_analytics_workspace_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_application_insights" "ai" {
  name                = var.application_insights_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "web"
  workspace_id        = azurerm_log_analytics_workspace.law.id
  sampling_percentage = 10
}

# =========================
# SINGLE Storage Account
# (Function runtime + Table)
# =========================
resource "azurerm_storage_account" "sa" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"

  shared_access_key_enabled = true # azurerm_storage_table requires this to be true, even if we won't use the keys
}

# =========================
# Storage Account Container for Function App
# =========================
resource "azurerm_storage_container" "fa" {
  name                  = lower("${var.function_app_name}-stor")
  storage_account_id    = azurerm_storage_account.sa.id
  container_access_type = "private"
}

# =========================
# Table Storage (for GitHub App installation info)
# =========================
resource "azurerm_storage_table" "installations" {
  name                 = var.installations_table_name
  storage_account_name = azurerm_storage_account.sa.name
}

# =========================
# Table Storage (for GitHub OAuth App tokens)
# =========================
resource "azurerm_storage_table" "tokens" {
  name                 = var.tokens_table_name
  storage_account_name = azurerm_storage_account.sa.name
}

# =========================
# Service Plan (Consumption)
# =========================
resource "azurerm_service_plan" "plan" {
  name                = "${var.function_app_name}-plan"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "FC1" # Flex Consumption Plan
}

# =========================
# Function App (uses SAME storage)
# =========================
resource "azurerm_function_app_flex_consumption" "fa" {
  name                = var.function_app_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.plan.id

  storage_container_type = "blobContainer"
  storage_container_endpoint = format(
    "%s%s/",
    azurerm_storage_account.sa.primary_blob_endpoint,
    azurerm_storage_container.fa.name
  )
  storage_authentication_type = "SystemAssignedIdentity"
  runtime_name                = "node"
  runtime_version             = "22"
  # maximum_instance_count      = 100
  # instance_memory_in_mb       = 2048
  identity {
    type = "SystemAssigned"
  }

  app_settings = {
    APPLICATIONINSIGHTS_AUTHENTICATION_STRING = "Authorization=AAD" #Monitoring Metrics Publisher
    AzureWebJobsStorage__accountName          = var.storage_account_name
    AzureWebJobsStorage__credential           = "managedidentity"
    AzureWebJobsStorage__queueServiceUri      = "https://${var.storage_account_name}.queue.core.windows.net/"
    AzureWebJobsStorage__tableServiceUri      = "https://${var.storage_account_name}.table.core.windows.net/"
    AzureWebJobsStorage__blobServiceUri       = "https://${var.storage_account_name}.blob.core.windows.net/"
    GITHUB_APP_ID                             = var.github_app_id
    OAUTH_CLIENT_ID                           = var.oauth_client_id
    ALLOWED_ORIGINS                           = var.allowed_origins
    JWT_SECRET                                = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.jwt.id})"
    OAUTH_SECRET                              = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.oauth_secret.id})"
    GITHUB_APP_PRIVATE_KEY                    = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.github_app_private_key.id})"
    STORAGE_ACCOUNT_TABLE_NAME                = var.storage_account_table_name
  }

  site_config {
    application_insights_connection_string = azurerm_application_insights.ai.connection_string
  }
}

# =========================
# Assign Role to Function App's Managed Identity
# =========================
resource "azurerm_role_assignment" "blob_access" {
  scope                = azurerm_storage_account.sa.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_function_app_flex_consumption.fa.identity[0].principal_id
}
resource "azurerm_role_assignment" "queue_access" {
  scope                = azurerm_storage_account.sa.id
  role_definition_name = "Storage Queue Data Contributor"
  principal_id         = azurerm_function_app_flex_consumption.fa.identity[0].principal_id
}
resource "azurerm_role_assignment" "table_access" {
  scope                = azurerm_storage_account.sa.id
  role_definition_name = "Storage Table Data Contributor"
  principal_id         = azurerm_function_app_flex_consumption.fa.identity[0].principal_id
}
resource "azurerm_role_assignment" "ai_access" {
  scope                = azurerm_application_insights.ai.id
  role_definition_name = "Monitoring Metrics Publisher"
  principal_id         = azurerm_function_app_flex_consumption.fa.identity[0].principal_id
}
resource "azurerm_role_assignment" "kv_access" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_function_app_flex_consumption.fa.identity[0].principal_id
}

# =========================
# key vault and secrets
# need "Key Vault Secrets Officer" or "Key Vault Administrator" role to create secrets
# =========================
resource "azurerm_key_vault" "kv" {
  name                = var.key_vault_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  tenant_id           = data.azurerm_client_config.current.tenant_id

  sku_name                   = "standard"
  rbac_authorization_enabled = true
  # purge_protection_enabled   = true
  soft_delete_retention_days = 7
}

resource "azurerm_role_assignment" "deployer_kv_access" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
  lifecycle {
    ignore_changes = [principal_id] # don't try to remove access from current user on destroy
  }
}

resource "azurerm_key_vault_secret" "jwt" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.kv.id
  lifecycle {
    ignore_changes = [value]
  }
  depends_on = [azurerm_role_assignment.deployer_kv_access]
}

resource "azurerm_key_vault_secret" "oauth_secret" {
  name         = "oauth-secret"
  value        = var.oauth_secret
  key_vault_id = azurerm_key_vault.kv.id
  lifecycle {
    ignore_changes = [value]
  }
  depends_on = [azurerm_role_assignment.deployer_kv_access]
}

resource "azurerm_key_vault_secret" "github_app_private_key" {
  name         = "github-app-private-key"
  value        = var.github_app_private_key
  key_vault_id = azurerm_key_vault.kv.id
  lifecycle {
    ignore_changes = [value]
  }
  depends_on = [azurerm_role_assignment.deployer_kv_access]
}
