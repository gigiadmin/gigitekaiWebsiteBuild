import fs from "node:fs/promises";
import crypto from "node:crypto";

const sourcePath = "/home/ubuntu/gigitekai-kb-remediation/duplicate-candidate-inputs.json";
const classificationPath = "/home/ubuntu/gigitekai-kb-remediation/duplicate-classifications-reconciled.json";
const outputPath = "/home/ubuntu/gigitekai-kb-remediation/duplicate-remediation-manifest.json";

const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const rawClassifications = JSON.parse(await fs.readFile(classificationPath, "utf8"));
const classifications = rawClassifications.results.map(result => result.output);
const classificationByNumber = new Map(classifications.map(item => [item.candidate_number, item]));

function normalizedContent(value) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function engagementScore(article) {
  return Number(article.viewCount ?? 0)
    + Number(article.ratingCount ?? 0) * 10
    + Number(article.commentCount ?? 0) * 10;
}

function metadataScore(article) {
  return [article.articleCode, article.externalUid, article.sourceUrl, article.syncSource]
    .filter(Boolean).length;
}

function selectCanonical(first, second) {
  const firstEngagement = engagementScore(first);
  const secondEngagement = engagementScore(second);
  if (firstEngagement !== secondEngagement) return firstEngagement > secondEngagement ? first : second;
  const firstMetadata = metadataScore(first);
  const secondMetadata = metadataScore(second);
  if (firstMetadata !== secondMetadata) return firstMetadata > secondMetadata ? first : second;
  return first.id < second.id ? first : second;
}

const manifest = [];
const validationErrors = [];
for (const pair of source) {
  const review = classificationByNumber.get(pair.candidateNumber);
  if (!review) {
    validationErrors.push(`Missing classification for candidate ${pair.candidateNumber}`);
    continue;
  }
  const sourceIds = [pair.first.id, pair.second.id].sort((a, b) => a - b).join(":");
  const reviewIds = [review.first_id, review.second_id].sort((a, b) => a - b).join(":");
  if (sourceIds !== reviewIds) {
    validationErrors.push(`Candidate ${pair.candidateNumber} ID mismatch: source ${sourceIds}, review ${reviewIds}`);
    continue;
  }

  const firstNormalized = normalizedContent(pair.first.content);
  const secondNormalized = normalizedContent(pair.second.content);
  const exactContentMatch = firstNormalized === secondNormalized;
  const canonical = exactContentMatch ? selectCanonical(pair.first, pair.second) : null;
  const subordinate = exactContentMatch
    ? (canonical.id === pair.first.id ? pair.second : pair.first)
    : null;
  const safeAction = exactContentMatch
    ? "archive_duplicate_with_redirect"
    : review.classification === "distinct_content"
      ? "keep_both"
      : review.recommended_action === "keep_both_and_retitle"
        ? "keep_both_and_retitle"
        : "manual_merge_required";

  manifest.push({
    candidateNumber: pair.candidateNumber,
    similarity: pair.similarity,
    firstId: pair.first.id,
    secondId: pair.second.id,
    firstTitle: pair.first.title,
    secondTitle: pair.second.title,
    firstContentHash: hash(firstNormalized),
    secondContentHash: hash(secondNormalized),
    exactContentMatch,
    reviewerClassification: review.classification,
    reviewerConfidence: review.confidence,
    safeAction,
    canonicalId: canonical?.id ?? 0,
    subordinateId: subordinate?.id ?? 0,
    canonicalSelectionReason: exactContentMatch
      ? "Engagement first, then metadata completeness, then oldest stable article ID."
      : "Not applicable; both records remain published pending a content-preserving decision.",
    firstUniqueGuidance: review.first_unique_guidance,
    secondUniqueGuidance: review.second_unique_guidance,
    rationale: review.rationale,
  });
}

if (validationErrors.length) {
  throw new Error(validationErrors.join("\n"));
}

const counts = manifest.reduce((accumulator, item) => {
  accumulator[item.safeAction] = (accumulator[item.safeAction] ?? 0) + 1;
  return accumulator;
}, {});

await fs.writeFile(outputPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  sourceCandidateCount: source.length,
  classificationCount: classifications.length,
  counts,
  candidates: manifest,
}, null, 2));

console.log(JSON.stringify({
  sourceCandidateCount: source.length,
  classificationCount: classifications.length,
  counts,
  manualReviewCandidateNumbers: manifest
    .filter(item => item.safeAction === "manual_merge_required")
    .map(item => item.candidateNumber),
  outputPath,
}, null, 2));
