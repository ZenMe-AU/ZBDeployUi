import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { fetchPlan } from "./fetchPlan";

type PlanItem = {
  address: string;
  change: {
    actions: string[];
  };
};

function getActionType(actions: string[]) {
  if (actions.includes("delete") && actions.includes("create")) return "replace";
  if (actions.includes("create")) return "create";
  if (actions.includes("delete")) return "delete";
  if (actions.includes("update")) return "update";
  if (actions.includes("no-op")) return null;
  return "unknown";
}

function getActionSymbol(type: string) {
  switch (type) {
    case "create":
      return "+";
    case "delete":
      return "-";
    case "update":
      return "~";
    case "replace":
      return "±";
    default:
      return "|";
  }
}

function getActionColor(type: string) {
  switch (type) {
    case "create":
      return "#4caf50";
    case "delete":
      return "#f44336";
    case "update":
      return "#ff9800";
    case "replace":
      return "#9c27b0";
    default:
      return "#999";
  }
}

export default function PlanView({ stage, path, account, repo }: { stage: string; path: string; account: any; repo: string }) {
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    fetchPlan(path, account, repo)
      .then((data) => {
        setPlan(data.resource_changes || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [path]);

  // Summary calculation
  const summary = plan.reduce(
    (acc, item) => {
      const type = getActionType(item.change.actions);

      if (type === "create") acc.create++;
      if (type === "update") acc.update++;
      if (type === "delete") acc.delete++;
      if (type === "replace") acc.replace++;

      return acc;
    },
    { create: 0, update: 0, delete: 0, replace: 0 },
  );
  const hasChanges = summary.create + summary.update + summary.delete + summary.replace > 0;
  if (loading) return <Typography>Loading plan...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (plan.length === 0 || !hasChanges) return <Typography>No changes</Typography>;

  return (
    <Box
      sx={{
        mt: 2,
        p: 2,
        background: "#111",
        color: "#eee",
        fontFamily: "monospace",
        borderRadius: 2,
      }}
    >
      {/* Summary */}
      <Box sx={{ mb: 2 }}>
        <Typography>
          Plan:
          <span style={{ color: getActionColor("create") }}> + {summary.create}</span> to add,
          <span style={{ color: getActionColor("update") }}> ~ {summary.update}</span> to change,
          <span style={{ color: getActionColor("delete") }}> - {summary.delete}</span> to destroy
          {summary.replace > 0 && (
            <>
              ,<span style={{ color: getActionColor("replace") }}> ± {summary.replace}</span> to replace
            </>
          )}
        </Typography>
      </Box>

      {/* Resource list */}
      {plan.map((item, idx) => {
        const type = getActionType(item.change.actions);
        if (!type) return null;
        const symbol = getActionSymbol(type);
        const color = getActionColor(type);

        return (
          <Box key={idx} sx={{ color }}>
            {symbol} {item.address}
          </Box>
        );
      })}
    </Box>
  );
}
