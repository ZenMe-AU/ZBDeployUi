import { Box, Button, Collapse, Divider, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import type { CardId, CardStatus, EnvEntry, Prerequisite, Stage, StageDefinition } from "../types.ts";
import { STAGE_STATUS_CONFIG } from "../types.ts";
import PlanView from "../planView";

// ─── Prerequisite check ───────────────────────────────────────────────────────

function checkPrerequisite(prereq: Prerequisite, cardStatus: Record<CardId, CardStatus>, envEntries: EnvEntry[]): boolean {
  switch (prereq.type) {
    case "card":
      return cardStatus[prereq.cardId] === "complete";
    case "env":
      return !!envEntries.find((e) => e.key === prereq.key && e.value.trim());
  }
}

function prereqLabel(prereq: Prerequisite): string {
  switch (prereq.type) {
    case "card": {
      const labels: Record<CardId, string> = {
        repo: "Repo selected",
        azure_secrets: "Azure secrets configured",
        aws_secrets: "AWS secrets configured",
        env: "Env configured",
        status_update: "Status update run",
        stages: "Stages",
      };
      return labels[prereq.cardId];
    }
    case "env":
      return `${prereq.key} set`;
  }
}

// ─── Single stage card ────────────────────────────────────────────────────────

function StageItem({
  stageDef,
  stage,
  expanded,
  onToggle,
  cardStatus,
  envEntries,
  account,
  repoName,
}: {
  stageDef: StageDefinition;
  stage: Stage;
  expanded: boolean;
  onToggle: () => void;
  cardStatus: Record<CardId, CardStatus>;
  envEntries: EnvEntry[];
  account: any;
  repoName: string;
}) {
  const cfg = STAGE_STATUS_CONFIG[stage.status] ?? { color: "#94a3b8", label: stage.status };
  const hasDetails = stage.status === "success" && !!stage.planJsonId && stage.planJsonUrl !== "";

  const prereqResults = stageDef.prerequisites.map((p) => ({
    label: prereqLabel(p),
    met: checkPrerequisite(p, cardStatus, envEntries),
  }));
  const allPrereqsMet = prereqResults.every((r) => r.met);
  const hasUnmetPrereqs = !allPrereqsMet && stage.status === "pending";

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor:
          stage.status === "deployed" ? "#bbf7d0" : stage.status === "failed" ? "#fecaca" : stage.status === "success" ? "#fed7aa" : "#e2e8f0",
        borderRadius: "8px",
        background: "#ffffff",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          cursor: hasDetails || hasUnmetPrereqs ? "pointer" : "default",
          "&:hover": hasDetails || hasUnmetPrereqs ? { background: "#fafafa" } : {},
        }}
        onClick={hasDetails || hasUnmetPrereqs ? onToggle : undefined}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Status dot */}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: cfg.color,
              boxShadow: `0 0 6px ${cfg.color}55`,
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a", fontFamily: "'IBM Plex Mono', monospace" }}>
              {stageDef.label}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: cfg.color, fontFamily: "'IBM Plex Mono', monospace", mt: 0.125 }}>{cfg.label}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {stage.status === "success" && (
            <Button
              size="small"
              variant="contained"
              onClick={(e) => {
                e.stopPropagation();
                console.log("Deploy", stage.stage, stage.runId);
              }}
              sx={{
                background: "#f97316",
                fontSize: "0.7rem",
                textTransform: "none",
                fontFamily: "'IBM Plex Mono', monospace",
                py: 0.4,
                px: 1.25,
                "&:hover": { background: "#ea6c0a" },
              }}
            >
              Deploy
            </Button>
          )}
          {hasUnmetPrereqs && <WarningAmberIcon sx={{ fontSize: 16, color: "#ea580c" }} />}
        </Box>
      </Box>

      {/* Expandable: plan details or unmet prerequisites */}
      <Collapse in={expanded}>
        <Divider sx={{ borderColor: "#f1f5f9" }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          {/* Prerequisites */}
          {stageDef.prerequisites.length > 0 && (
            <Box sx={{ mb: hasDetails ? 2 : 0 }}>
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  color: "#94a3b8",
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  mb: 1,
                }}
              >
                Prerequisites
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {prereqResults.map((r, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {r.met ? (
                      <CheckCircleIcon sx={{ fontSize: 13, color: "#22c55e" }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ fontSize: 13, color: "#cbd5e1" }} />
                    )}
                    <Typography sx={{ fontSize: "0.72rem", color: r.met ? "#475569" : "#94a3b8", fontFamily: "'IBM Plex Mono', monospace" }}>
                      {r.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Plan view */}
          {hasDetails && <PlanView stage={stage.stage} path={stage.planJsonId!} account={account} repo={repoName} />}
        </Box>
      </Collapse>
    </Box>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  stages: Stage[];
  stageDefinitions: StageDefinition[];
  expanded: Record<string, boolean>;
  onToggle: (key: string) => void;
  statusFileFound: boolean;
  loading: boolean;
  cardStatus: Record<CardId, CardStatus>;
  envEntries: EnvEntry[];
  account: any;
  repoName: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StagesCard({
  stages,
  stageDefinitions,
  expanded,
  onToggle,
  statusFileFound,
  loading,
  cardStatus,
  envEntries,
  account,
  repoName,
}: Props) {
  if (loading) {
    return <Box sx={{ py: 2, color: "#94a3b8", fontSize: "0.78rem", fontFamily: "'IBM Plex Mono', monospace" }}>Loading stages...</Box>;
  }

  return (
    <Box>
      {/* No status file banner */}
      {!statusFileFound && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1.5,
            mb: 2.5,
            borderRadius: "8px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
          <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", fontFamily: "'IBM Plex Mono', monospace" }}>
            No status file found. Run a status update to generate the deployment changeset.
          </Typography>
        </Box>
      )}

      {/* Stage list */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {stages.map((stage) => {
          const def = stageDefinitions.find((d) => d.key === stage.stage);
          if (!def) return null;
          return (
            <StageItem
              key={stage.stage}
              stageDef={def}
              stage={stage}
              expanded={!!expanded[stage.stage]}
              onToggle={() => onToggle(stage.stage)}
              cardStatus={cardStatus}
              envEntries={envEntries}
              account={account}
              repoName={repoName}
            />
          );
        })}
      </Box>
    </Box>
  );
}
