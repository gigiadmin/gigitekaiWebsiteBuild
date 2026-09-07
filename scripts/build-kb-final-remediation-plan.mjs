import fs from "node:fs/promises";

const sourcePath = "/home/ubuntu/gigitekai-kb-remediation/duplicate-candidate-inputs.json";
const firstPassPath = "/home/ubuntu/gigitekai-kb-remediation/duplicate-remediation-manifest.json";
const overlapPath = "/home/ubuntu/resolve_kb_overlap_candidates.json";
const outputPath = "/home/ubuntu/gigitekai-kb-remediation/final-duplicate-remediation-plan.json";

const sourceCandidates = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const firstPass = JSON.parse(await fs.readFile(firstPassPath, "utf8"));
const overlapResults = JSON.parse(await fs.readFile(overlapPath, "utf8")).results;

const sourceByNumber = new Map(sourceCandidates.map(candidate => [candidate.candidateNumber, candidate]));
const overlapByNumber = new Map(overlapResults.map(result => [result.output.candidate_number, result.output]));
const articleById = new Map();
for (const candidate of sourceCandidates) {
  articleById.set(candidate.first.id, candidate.first);
  articleById.set(candidate.second.id, candidate.second);
}

function samePair(firstId, secondId, expectedFirst, expectedSecond) {
  return new Set([firstId, secondId]).size === new Set([expectedFirst, expectedSecond]).size
    && [firstId, secondId].every(id => id === expectedFirst || id === expectedSecond);
}

const decisions = firstPass.candidates.map(candidate => {
  const source = sourceByNumber.get(candidate.candidateNumber);
  if (!source) throw new Error(`Missing source candidate ${candidate.candidateNumber}`);
  if (!samePair(candidate.firstId, candidate.secondId, source.first.id, source.second.id)) {
    throw new Error(`First-pass ID mismatch for candidate ${candidate.candidateNumber}`);
  }

  if (candidate.safeAction === "archive_duplicate_with_redirect") {
    return {
      candidateNumber: candidate.candidateNumber,
      firstId: candidate.firstId,
      secondId: candidate.secondId,
      action: "archive_redundant_with_redirect",
      canonicalId: candidate.canonicalId,
      subordinateId: candidate.subordinateId,
      mergePlan: "NONE",
      uniqueContentToPreserve: "NONE",
      rationale: candidate.rationale,
      confidence: candidate.reviewerConfidence,
    };
  }

  const overlap = overlapByNumber.get(candidate.candidateNumber);
  if (!overlap) throw new Error(`Missing overlap review for candidate ${candidate.candidateNumber}`);
  if (!samePair(overlap.first_id, overlap.second_id, source.first.id, source.second.id)) {
    throw new Error(`Overlap-review ID mismatch for candidate ${candidate.candidateNumber}`);
  }
  return {
    candidateNumber: candidate.candidateNumber,
    firstId: candidate.firstId,
    secondId: candidate.secondId,
    action: overlap.safe_action,
    canonicalId: overlap.canonical_id,
    subordinateId: overlap.subordinate_id,
    mergePlan: overlap.merge_plan,
    uniqueContentToPreserve: overlap.unique_content_to_preserve,
    recommendedFirstTitle: overlap.recommended_first_title,
    recommendedSecondTitle: overlap.recommended_second_title,
    rationale: overlap.rationale,
    confidence: overlap.confidence,
  };
});

const parent = new Map();
function find(id) {
  if (!parent.has(id)) parent.set(id, id);
  if (parent.get(id) !== id) parent.set(id, find(parent.get(id)));
  return parent.get(id);
}
function union(a, b) {
  const rootA = find(a);
  const rootB = find(b);
  if (rootA !== rootB) parent.set(rootB, rootA);
}

for (const decision of decisions) union(decision.firstId, decision.secondId);
const componentIds = new Map();
for (const id of articleById.keys()) {
  const root = find(id);
  const ids = componentIds.get(root) ?? [];
  ids.push(id);
  componentIds.set(root, ids);
}

function engagementScore(article) {
  return Number(article?.viewCount ?? 0) + Number(article?.ratingCount ?? 0) * 10 + Number(article?.commentCount ?? 0) * 10;
}
function metadataScore(article) {
  return [article?.articleCode, article?.sourceUrl, article?.externalUid, article?.syncSource, article?.tags, article?.subcategory]
    .filter(Boolean).length;
}
function chooseCanonical(ids, componentDecisions) {
  const preferredCounts = new Map();
  for (const decision of componentDecisions) {
    if (decision.canonicalId > 0) {
      preferredCounts.set(decision.canonicalId, (preferredCounts.get(decision.canonicalId) ?? 0) + 1);
    }
  }
  return [...ids].sort((a, b) => {
    const preferredDifference = (preferredCounts.get(b) ?? 0) - (preferredCounts.get(a) ?? 0);
    if (preferredDifference) return preferredDifference;
    const engagementDifference = engagementScore(articleById.get(b)) - engagementScore(articleById.get(a));
    if (engagementDifference) return engagementDifference;
    const metadataDifference = metadataScore(articleById.get(b)) - metadataScore(articleById.get(a));
    if (metadataDifference) return metadataDifference;
    return a - b;
  })[0];
}

const components = [...componentIds.values()].map(ids => {
  const idSet = new Set(ids);
  const componentDecisions = decisions.filter(decision => idSet.has(decision.firstId) && idSet.has(decision.secondId));
  const keepBothDecision = componentDecisions.find(decision => decision.action === "keep_both" || decision.action === "keep_both_and_retitle");
  if (keepBothDecision) {
    return {
      candidateNumbers: componentDecisions.map(decision => decision.candidateNumber),
      ids: [...ids].sort((a, b) => a - b),
      action: keepBothDecision.action,
      canonicalId: null,
      subordinateIds: [],
      titleRecommendations: componentDecisions.map(decision => ({
        candidateNumber: decision.candidateNumber,
        firstId: decision.firstId,
        firstTitle: decision.recommendedFirstTitle,
        secondId: decision.secondId,
        secondTitle: decision.recommendedSecondTitle,
      })),
      rationale: componentDecisions.map(decision => decision.rationale),
    };
  }

  let canonicalId = chooseCanonical(ids, componentDecisions);
  let mergeSources = componentDecisions
    .filter(decision => decision.action === "merge_then_archive_with_redirect")
    .map(decision => ({
      sourceId: decision.subordinateId,
      uniqueContentToPreserve: decision.uniqueContentToPreserve,
      mergePlan: decision.mergePlan,
      candidateNumber: decision.candidateNumber,
    }));

  const sortedIds = [...ids].sort((a, b) => a - b);
  if (sortedIds.join(",") === "1740001,1770001,1770002") {
    canonicalId = 1740001;
    mergeSources = [{
      sourceId: 1770001,
      uniqueContentToPreserve: "Add-data-disk provisioning plus Windows/Linux initialization and formatting procedures.",
      mergePlan: "Append the unique data-disk expansion procedures from article 1770001 to canonical article 1740001.",
      candidateNumber: 59,
    }];
  }
  if (sortedIds.join(",") === "210068,330003") {
    canonicalId = 210068;
    mergeSources = [{
      sourceId: 330003,
      uniqueContentToPreserve: "Escalation conditions for Security info page access, repeated QR failures, and missing verification methods.",
      mergePlan: "Append the escalation conditions to the canonical MFA guide and update legacy support contact details.",
      candidateNumber: 63,
    }];
  }

  return {
    candidateNumbers: componentDecisions.map(decision => decision.candidateNumber).sort((a, b) => a - b),
    ids: sortedIds,
    action: mergeSources.length ? "merge_then_archive_with_redirect" : "archive_redundant_with_redirect",
    canonicalId,
    subordinateIds: sortedIds.filter(id => id !== canonicalId),
    mergeSources,
    rationale: componentDecisions.map(decision => decision.rationale),
  };
});

const archiveMappings = components.flatMap(component =>
  component.subordinateIds.map(archivedArticleId => ({
    archivedArticleId,
    canonicalArticleId: component.canonicalId,
    disposition: component.action === "merge_then_archive_with_redirect" ? "merged" : "duplicate",
    reason: component.action === "merge_then_archive_with_redirect"
      ? "Unique guidance preserved in the canonical article before archival."
      : "Redundant content retained through a canonical redirect; original source is backed up.",
    candidateNumbers: component.candidateNumbers,
  })),
);

const canonicalIds = new Set(components.map(component => component.canonicalId).filter(Boolean));
for (const mapping of archiveMappings) {
  if (canonicalIds.has(mapping.archivedArticleId)) {
    throw new Error(`Unsafe plan: article ${mapping.archivedArticleId} is both a canonical record and an archive target`);
  }
  if (!articleById.has(mapping.archivedArticleId) || !articleById.has(mapping.canonicalArticleId)) {
    throw new Error(`Unsafe plan: mapping ${mapping.archivedArticleId} -> ${mapping.canonicalArticleId} references an unknown article`);
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  sourceCandidateCount: sourceCandidates.length,
  validatedDecisionCount: decisions.length,
  componentCount: components.length,
  archiveMappingCount: archiveMappings.length,
  mergeComponentCount: components.filter(component => component.action === "merge_then_archive_with_redirect").length,
  keepBothComponentCount: components.filter(component => component.action === "keep_both" || component.action === "keep_both_and_retitle").length,
  components,
  archiveMappings,
};

await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify({
  sourceCandidateCount: output.sourceCandidateCount,
  validatedDecisionCount: output.validatedDecisionCount,
  componentCount: output.componentCount,
  archiveMappingCount: output.archiveMappingCount,
  mergeComponentCount: output.mergeComponentCount,
  keepBothComponentCount: output.keepBothComponentCount,
  outputPath,
}, null, 2));
