import { Box, TextField, Typography } from "@mui/material";
import type { EnvEntry } from "../types";
import { REQUIRED_ENV_KEYS } from "../types";

// ─── Shared input style ───────────────────────────────────────────────────────

const inputSx = {
  "& .MuiInputBase-root": {
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.8rem",
    borderRadius: "6px",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e2e8f0" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
  "& .MuiInputBase-input::placeholder": { color: "#94a3b8" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  envEntries: EnvEntry[];
  onChange: (entries: EnvEntry[]) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function EnvCard({ envEntries, onChange }: Props) {
  const getValue = (key: string) => envEntries.find((e) => e.key === key)?.value ?? "";

  const updateValue = (key: string, value: string) => {
    const exists = envEntries.find((e) => e.key === key);
    if (exists) {
      onChange(envEntries.map((e) => (e.key === key ? { ...e, value } : e)));
    } else {
      onChange([...envEntries, { key, value }]);
    }
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "0.78rem", color: "#64748b", mb: 2.5 }}>
        These variables are passed as inputs to the GitHub Actions workflow on each run.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {REQUIRED_ENV_KEYS.map((key) => (
          <Box key={key} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField size="small" value={key} disabled sx={{ flex: 1, ...inputSx }} />
            <TextField
              size="small"
              placeholder="value"
              value={getValue(key)}
              onChange={(e) => updateValue(key, e.target.value)}
              sx={{ flex: 2, ...inputSx }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
