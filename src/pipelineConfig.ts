import type { PipelineConfig } from "./types";

export const PIPELINES: Record<string, PipelineConfig> = {
  corpSetup: {
    workflowId: "planChanges.yml",
    label: "Corp Setup",
    templateRepo: "ZenMe-AU/ZBCorpArchitecture",
    stages: [
      {
        key: "c01",
        label: "c01subscription",
        prerequisites: [
          { type: "card", cardId: "azure_secrets" },
          { type: "env", key: "NAME" },
          { type: "env", key: "SUBSCRIPTION_ID" },
        ],
      },
      {
        key: "c02",
        label: "c02globalGroups",
        prerequisites: [
          { type: "card", cardId: "azure_secrets" },
          { type: "env", key: "NAME" },
          { type: "env", key: "SUBSCRIPTION_ID" },
        ],
      },
      {
        key: "c05",
        label: "c05rootrg",
        prerequisites: [
          { type: "card", cardId: "azure_secrets" },
          { type: "env", key: "NAME" },
          { type: "env", key: "DNS" },
          { type: "env", key: "SUBSCRIPTION_ID" },
        ],
      },
      {
        key: "c20",
        label: "c20awsentrasso",
        prerequisites: [
          { type: "card", cardId: "azure_secrets" },
          { type: "env", key: "NAME" },
          { type: "env", key: "DNS" },
          { type: "env", key: "SUBSCRIPTION_ID" },
        ],
      },
      {
        key: "c21",
        label: "c21awsentrassoP2",
        prerequisites: [
          { type: "card", cardId: "azure_secrets" },
          { type: "card", cardId: "aws_secrets" },
          { type: "env", key: "NAME" },
          { type: "env", key: "DNS" },
          { type: "env", key: "SUBSCRIPTION_ID" },
        ],
      },
      {
        key: "c25",
        label: "c25cloudfront",
        prerequisites: [
          { type: "card", cardId: "azure_secrets" },
          { type: "card", cardId: "aws_secrets" },
          { type: "env", key: "NAME" },
          { type: "env", key: "DNS" },
          { type: "env", key: "SUBSCRIPTION_ID" },
        ],
      },
    ],
  },
  // Add future pipelines here — no other files need to change
};

export function matchPipelineByTemplate(templateName: string): string | null {
  const entry = Object.entries(PIPELINES).find(([, cfg]) => cfg.templateRepo === templateName);
  return entry ? entry[0] : null;
}
