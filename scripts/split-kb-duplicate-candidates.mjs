import fs from "node:fs/promises";
import path from "node:path";

const inputPath = "/home/ubuntu/gigitekai-kb-remediation/duplicate-candidate-inputs.json";
const outputDir = "/home/ubuntu/gigitekai-kb-remediation/candidates";
const candidates = JSON.parse(await fs.readFile(inputPath, "utf8"));

await fs.mkdir(outputDir, { recursive: true });
await Promise.all(candidates.map(candidate => fs.writeFile(
  path.join(outputDir, `candidate-${String(candidate.candidateNumber).padStart(2, "0")}.json`),
  JSON.stringify(candidate, null, 2),
)));

console.log(JSON.stringify({ candidateCount: candidates.length, outputDir }, null, 2));
