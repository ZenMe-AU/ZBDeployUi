import { Box, Button, Tooltip, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircularProgress from "@mui/material/CircularProgress";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import type { SecretsStatus } from "../types.ts";

// ─── Single secret key row ────────────────────────────────────────────────────

function SecretKeyRow({ secretKey, present, valid }: { secretKey: string; present: boolean; valid: boolean | null }) {
  const showValid = present && valid !== null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.75 }}>
      {/* Present indicator */}
      {present ? (
        <CheckCircleIcon sx={{ fontSize: 15, color: "#22c55e", flexShrink: 0 }} />
      ) : (
        <RadioButtonUncheckedIcon sx={{ fontSize: 15, color: "#cbd5e1", flexShrink: 0 }} />
      )}

      {/* Key name */}
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontFamily: "'IBM Plex Mono', monospace",
          color: present ? "#0f172a" : "#94a3b8",
          flex: 1,
        }}
      >
        {secretKey}
      </Typography>

      {/* Valid indicator — only shown after run */}
      {showValid && (
        <Tooltip title={valid ? "Validated after last run" : "Validation failed after last run"}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: "4px",
              background: valid ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${valid ? "#bbf7d0" : "#fecaca"}`,
              fontSize: "0.65rem",
              fontFamily: "'IBM Plex Mono', monospace",
              color: valid ? "#16a34a" : "#ef4444",
            }}
          >
            {valid ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 11 }} /> valid
              </>
            ) : (
              <>
                <ErrorOutlineIcon sx={{ fontSize: 11 }} /> invalid
              </>
            )}
          </Box>
        </Tooltip>
      )}

      {/* Not set label */}
      {!present && <Typography sx={{ fontSize: "0.65rem", color: "#cbd5e1", fontFamily: "'IBM Plex Mono', monospace" }}>not set</Typography>}
    </Box>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  provider: "azure" | "aws";
  requiredKeys: string[];
  presentKeys: string[]; // keys returned by getSecrets
  secretsStatus: SecretsStatus;
  repoFullName: string | null; // e.g. "myorg/myrepo" for GitHub secrets link
  onRecheck: () => void;
  rechecking?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

const PROVIDER_CONFIG = {
  azure: {
    label: "Azure Login",
    description: "Required for Azure resource deployment",
    docsUrl: "https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure",
  },
  aws: {
    label: "AWS Login",
    description: "Required for AWS resource deployment",
    docsUrl: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html",
  },
};

export default function SecretsCard({ provider, requiredKeys, presentKeys, secretsStatus, repoFullName, onRecheck, rechecking }: Props) {
  const cfg = PROVIDER_CONFIG[provider];
  const allConfigured = requiredKeys.every((k) => presentKeys.includes(k));
  const missingKeys = requiredKeys.filter((k) => !presentKeys.includes(k));

  const githubSecretsUrl = repoFullName ? `https://github.com/${repoFullName}/settings/secrets/actions` : null;

  return (
    <Box>
      {/* Description */}
      <Typography sx={{ fontSize: "0.78rem", color: "#64748b", mb: 2 }}>
        {cfg.description}. The following GitHub Actions secrets must be configured.
      </Typography>

      {/* Key list */}
      <Box
        sx={{
          border: "1px solid #f1f5f9",
          borderRadius: "8px",
          overflow: "hidden",
          mb: 2,
        }}
      >
        {requiredKeys.map((k, idx) => (
          <Box
            key={k}
            sx={{
              px: 2,
              borderBottom: idx < requiredKeys.length - 1 ? "1px solid #f8fafc" : "none",
              background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
            }}
          >
            <SecretKeyRow secretKey={k} present={presentKeys.includes(k)} valid={secretsStatus.valid} />
          </Box>
        ))}
      </Box>

      {/* Status summary */}
      {secretsStatus.configured === false || (!allConfigured && secretsStatus.configured !== null) ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            p: 1.5,
            borderRadius: "8px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            mb: 2,
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 16, color: "#ea580c", flexShrink: 0, mt: 0.1 }} />
          <Box>
            <Typography sx={{ fontSize: "0.78rem", color: "#ea580c", fontWeight: 600 }}>
              {missingKeys.length} secret{missingKeys.length > 1 ? "s" : ""} not configured
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#ea580c", mt: 0.25 }}>{missingKeys.join(", ")}</Typography>
          </Box>
        </Box>
      ) : secretsStatus.valid === false ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.5,
            borderRadius: "8px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            mb: 2,
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 16, color: "#ef4444", flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.78rem", color: "#ef4444" }}>
            Secrets are set but validation failed on last run. Check your credentials.
          </Typography>
        </Box>
      ) : null}

      {/* Actions */}
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
        {githubSecretsUrl && (
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            onClick={() => window.open(githubSecretsUrl, "_blank")}
            sx={{
              borderColor: "#e2e8f0",
              color: "#475569",
              fontSize: "0.75rem",
              textTransform: "none",
              fontFamily: "'IBM Plex Mono', monospace",
              "&:hover": { borderColor: "#cbd5e1", color: "#0f172a", background: "#f8fafc" },
            }}
          >
            Manage Secrets on GitHub
          </Button>
        )}
        {/* Re-check button */}
        <Button
          size="small"
          variant="outlined"
          onClick={onRecheck}
          disabled={rechecking}
          startIcon={rechecking ? <CircularProgress size={12} sx={{ color: "#94a3b8" }} /> : <RefreshIcon sx={{ fontSize: 14 }} />}
          sx={{
            borderColor: "#e2e8f0",
            color: "#475569",
            fontSize: "0.75rem",
            textTransform: "none",
            fontFamily: "'IBM Plex Mono', monospace",
            "&:hover": { borderColor: "#cbd5e1", color: "#0f172a", background: "#f8fafc" },
            "&.Mui-disabled": { borderColor: "#f1f5f9", color: "#cbd5e1" },
          }}
        >
          {rechecking ? "Checking..." : "Re-check"}
        </Button>

        {/* <Button
          size="small"
          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          onClick={() => window.open(cfg.docsUrl, "_blank")}
          sx={{
            color: "#94a3b8",
            fontSize: "0.72rem",
            textTransform: "none",
            fontFamily: "'IBM Plex Mono', monospace",
            "&:hover": { color: "#475569" },
          }}
        >
          Setup guide
        </Button> */}
      </Box>
    </Box>
  );
}
