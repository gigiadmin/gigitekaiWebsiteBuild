import fs from "node:fs/promises";

const originalPath = "/home/ubuntu/classify_kb_duplicate_candidates.json";
const repairPath = "/home/ubuntu/repair_kb_duplicate_classifications.json";
const outputPath = "/home/ubuntu/gigitekai-kb-remediation/duplicate-classifications-reconciled.json";

const original = JSON.parse(await fs.readFile(originalPath, "utf8"));
const repairs = JSON.parse(await fs.readFile(repairPath, "utf8"));
const repairByNumber = new Map(repairs.results.map(result => [result.output.candidate_number, result]));

const mergedResults = original.results.map(result => {
  const replacement = repairByNumber.get(result.output.candidate_number);
  return replacement ?? result;
});

const candidateNumbers = mergedResults.map(result => result.output.candidate_number);
const uniqueNumbers = new Set(candidateNumbers);
if (mergedResults.length !== 63 || uniqueNumbers.size !== 63) {
  throw new Error(`Expected 63 unique classifications, got ${mergedResults.length} records and ${uniqueNumbers.size} unique candidate numbers`);
}

await fs.writeFile(outputPath, JSON.stringify({ results: mergedResults }, null, 2));
console.log(JSON.stringify({
  originalCount: original.results.length,
  repairedCandidates: [...repairByNumber.keys()].sort((a, b) => a - b),
  reconciledCount: mergedResults.length,
  outputPath,
}, null, 2));
