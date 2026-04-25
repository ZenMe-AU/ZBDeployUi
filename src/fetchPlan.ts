import JSZip from "jszip";

// const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const url = import.meta.env.VITE_API_URL;

export async function fetchPlan(id: string, account: { login: string; type: string }, repo: string) {
  const params = new URLSearchParams({
    artifacts_id: id,
    owner: account.login,
    type: account.type,
    repo: repo,
    // ref: "main"
  });
  const res = await fetch(`${url}/downloadArtifacts?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch plan for ${url}`);
  }

  const data = await res.json();
  const text = data.content;
  const zip = await JSZip.loadAsync(text, { base64: true });
  const fileName = Object.keys(zip.files).find((f) => f.endsWith(".json"));
  if (!fileName) throw new Error("No JSON file found in artifact zip");
  const content = await zip.file(fileName)!.async("string");
  console.log("Fetched and extracted plan content", content);
  return JSON.parse(content);
}
