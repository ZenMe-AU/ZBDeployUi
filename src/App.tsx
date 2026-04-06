import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Button, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PlanView from "./planView";
import { parse } from "dotenv";

const statusColor = {
  deployed: "#4caf50",
  success: "#ff9800",
  failed: "#f44336",
};

const statusCode = {
  deployed: "Deployed",
  success: "Ready to deploy",
  failed: "Failed",
};

const stagePathMap: Record<string, string> = {
  c01: "c01subscription",
  c02: "c02globalGroups",
  c05: "c05rootrg",
};

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
async function triggerWorkflow(env: Record<string, string>) {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not defined");
  }
  console.log("Triggering workflow with env", env);
  return await fetch("https://api.github.com/repos/ZenMe-AU/ZBCorpArchitecture/actions/workflows/planChanges.yml/dispatches", {
    method: "POST",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      ref: "dev",
      inputs: {
        env: JSON.stringify(env),
      },
    }),
  });
}

async function triggerDeploy({ run_id, stage }) {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not defined");
  }
  console.log("Triggering deploy for", stage, "with run_id", run_id);
  // return fetch("https://api.github.com/repos/ZenMe-AU/ZBCorpArchitecture/actions/workflows/deploy.yml/dispatches", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `token ${GITHUB_TOKEN}`,
  //     Accept: "application/vnd.github+json",
  //   },
  //   body: JSON.stringify({
  //     ref: "dev",
  //     inputs: {
  //       run_id: String(run_id),
  //       stage,
  //     },
  //   }),
  // });
}

async function fetchStatus() {
  const url = `https://raw.githubusercontent.com/ZenMe-AU/ZBCorpArchitecture/dev/corpSetup/deploymentChangeset.json`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch status.json: ${response.status}`);
  }

  const data = await response.json();
  console.log("Fetched status.json", data);
  return data;
}

async function fetchEnv() {
  const url = "https://raw.githubusercontent.com/ZenMe-AU/ZBCorpArchitecture/dev/corpSetup/corp.env";

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch corp.env: ${response.status}`);
  }

  const text = await response.text();
  const obj = parse(text);
  console.log("Fetched corp.env", text, obj);
  return obj;
}

function sortStages(data: any[]) {
  return [...data].sort((a, b) => {
    const numA = parseInt(a.stage.replace(/\D/g, ""), 10);
    const numB = parseInt(b.stage.replace(/\D/g, ""), 10);
    return numA - numB;
  });
}

export default function App() {
  const [stages, setStages] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [env, setEnv] = useState<Record<string, string>>({});

  const handleRun = async () => {
    const now = Date.now();
    setLastRunTime(now);
    setRefreshing(true);
    setCountdown(180);

    try {
      // Pass envObj as input to workflow
      await triggerWorkflow(env);
    } catch (err) {
      console.error("Trigger failed", err);
      setRefreshing(false);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          fetchStatus()
            .then((data) => setStages(sortStages(data.stages || [])))
            .catch(console.error)
            .finally(() => setRefreshing(false));

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    fetchStatus()
      .then((data) => setStages(sortStages(data.stages || [])))
      .catch(console.error);

    fetchEnv().then(setEnv).catch(console.error);
  }, []);

  const toggle = (stage: string) => {
    setExpanded((prev) => ({
      ...prev,
      [stage]: !prev[stage],
    }));
  };

  return (
    <Box sx={{ p: 4, background: "#f4f6f8", minHeight: "100vh" }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4">Corp Setup Dashboard</Typography>

          {lastRunTime && (
            <Typography variant="body2" color="text.secondary">
              Last run: {new Date(lastRunTime).toLocaleTimeString()}
            </Typography>
          )}

          {refreshing && (
            <Typography variant="body2" color="text.secondary">
              Refreshing in {countdown >= 60 ? `${Math.ceil(countdown / 60)} min` : `${countdown} sec`}
            </Typography>
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Button variant="contained" onClick={handleRun} disabled={refreshing}>
            Run Status Update
          </Button>
        </Box>
      </Box>

      {/* Timeline */}
      <Box sx={{ position: "relative", ml: 2 }}>
        {stages.map((item, index) => (
          <Box
            key={item.stage}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              pb: 4,
              position: "relative",
            }}
          >
            {/* dot
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: statusColor[item.status],
                mt: 1,
                mr: 2,
                zIndex: 1,
              }}
            />*/}

            {/* line (only if NOT last)
            {index < stages.length - 1 && (
              <Box
                sx={{
                  position: "absolute",
                  left: 5,
                  top: 16,
                  height: "100%",
                  width: 2,
                  backgroundColor: "#ccc",
                  zIndex: 0,
                }}
              />
            )}*/}

            {/* card */}
            <Card sx={{ minWidth: 260, width: "100%", zIndex: 1 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">{stagePathMap[item.stage] || item.stage}</Typography>

                  <IconButton onClick={() => toggle(item.stage)} sx={{ display: item.planPath !== "" ? "block" : "none" }}>
                    {expanded[item.stage] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>

                <Typography variant="body2" sx={{ color: statusColor[item.status] }}>
                  {statusCode[item.status]}
                </Typography>

                {item.status === "success" && (
                  <Button
                    onClick={() =>
                      console.log("Deploying", item) ||
                      triggerDeploy({
                        run_id: item.runId,
                        stage: item.name,
                      })
                    }
                    size="small"
                    variant="contained"
                    sx={{ mt: 1 }}
                  >
                    Deploy
                  </Button>
                )}

                {/* Plan */}
                {expanded[item.stage] && item.status === "success" && item.planJsonId && item.planJsonUrl !== "" && (
                  <PlanView stage={item.stage} path={item.planJsonUrl} />
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
      <>
        {Object.entries(env).map(([key, value]) => (
          <Box key={key}>
            <Typography>{key}</Typography>
            <input
              value={value}
              onChange={(e) =>
                setEnv((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }))
              }
            />
          </Box>
        ))}
      </>
    </Box>
  );
}
