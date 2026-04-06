import JSZip from "jszip";

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

export async function fetchPlan(url: string) {
  //   const url = `https://raw.githubusercontent.com/ZenMe-AU/ZBCorpArchitecture/dev/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch plan for ${url}`);
  }
  const buffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const fileName = Object.keys(zip.files).find((f) => f.endsWith(".json"));
  if (!fileName) throw new Error("No JSON file found in artifact zip");
  const content = await zip.file(fileName)!.async("string");
  console.log("Fetched and extracted plan content", content);
  return JSON.parse(content);
}
