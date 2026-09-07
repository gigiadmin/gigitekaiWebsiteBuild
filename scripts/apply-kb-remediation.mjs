import fs from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { kbArticleRedirects, kbArticles } from "../drizzle/schema.ts";

const APPLY = process.argv.includes("--apply");
const outputDir = "/home/ubuntu/gigitekai-kb-remediation";
const planPath = path.join(outputDir, "final-duplicate-remediation-plan.json");
const backupPath = path.join(outputDir, "kb-article-backup-before-remediation.json");
const resultPath = path.join(outputDir, "kb-remediation-result.json");

const plan = JSON.parse(await fs.readFile(planPath, "utf8"));
const archiveIds = plan.archiveMappings.map(mapping => Number(mapping.archivedArticleId));
const canonicalIds = [...new Set(plan.archiveMappings.map(mapping => Number(mapping.canonicalArticleId)))];
const referenceArticleIds = [1, 60001, 210045, 210090, 210101, 1740028, 1770028, 1740029, 1770029, 1740039, 1770039, 2100017, 2100065, 2100096];
const mergeCanonicalIds = [1740001, 210068];
const affectedIds = [...new Set([...archiveIds, ...canonicalIds, ...referenceArticleIds, ...mergeCanonicalIds])].sort((a, b) => a - b);

const db = await getDb();
if (!db) throw new Error("Knowledge Base database is unavailable");

const currentArticles = await db.select().from(kbArticles).where(inArray(kbArticles.id, affectedIds));
const articleById = new Map(currentArticles.map(article => [article.id, article]));
const missingIds = affectedIds.filter(id => !articleById.has(id));
if (missingIds.length) throw new Error(`Refusing remediation because article IDs are missing: ${missingIds.join(", ")}`);

for (const mapping of plan.archiveMappings) {
  if (mapping.archivedArticleId === mapping.canonicalArticleId) {
    throw new Error(`Invalid self-redirect for article ${mapping.archivedArticleId}`);
  }
  if (articleById.get(mapping.canonicalArticleId)?.isPublished !== 1) {
    throw new Error(`Canonical article ${mapping.canonicalArticleId} is not published`);
  }
}

const existingRedirects = archiveIds.length
  ? await db.select().from(kbArticleRedirects).where(inArray(kbArticleRedirects.archivedArticleId, archiveIds))
  : [];
for (const existing of existingRedirects) {
  const planned = plan.archiveMappings.find(mapping => mapping.archivedArticleId === existing.archivedArticleId);
  if (!planned || planned.canonicalArticleId !== existing.canonicalArticleId) {
    throw new Error(`Existing redirect conflict for archived article ${existing.archivedArticleId}`);
  }
}

await fs.mkdir(outputDir, { recursive: true });
try {
  await fs.access(backupPath);
} catch {
  await fs.writeFile(backupPath, JSON.stringify({
    createdAt: new Date().toISOString(),
    purpose: "Pre-remediation source backup for reversible Knowledge Base reference corrections, content merges, and duplicate archival.",
    affectedArticleCount: currentArticles.length,
    articles: currentArticles,
    preexistingRedirects: existingRedirects,
  }, null, 2));
}

function replaceRequired(content, oldValue, newValue, articleId) {
  if (content.includes(newValue)) return content;
  if (!content.includes(oldValue)) throw new Error(`Article ${articleId} is missing expected value: ${oldValue}`);
  return content.split(oldValue).join(newValue);
}

const referenceUpdates = new Map();
let content = articleById.get(210090).content;
content = replaceRequired(content, "https://account.microsoft.com/devices/recoverykey", "https://support.microsoft.com/en-us/windows/security/encryption/find-your-bitlocker-recovery-key", 210090);
content = content.split("(727) 382-5776").join("609-676-4483");
referenceUpdates.set(210090, content);

content = articleById.get(1).content;
content = replaceRequired(content, "https://gigitest.com/login", "https://gigitekai.com/helpdesk", 1);
content = content.split("support@gigitest.com").join("support@gigitekai.com");
referenceUpdates.set(1, content);

content = articleById.get(60001).content;
content = replaceRequired(content, "support@gigitest.com", "support@gigitekai.com", 60001);
content = replaceRequired(content, "https://gigitest.com/support", "https://gigitekai.com/support", 60001);
referenceUpdates.set(60001, content);

content = articleById.get(210101).content;
content = replaceRequired(content, "https://gigitest.com", "https://gigitekai.com", 210101);
content = content.split(">gigitest.com<").join(">gigitekai.com<");
content = content.split("(727) 382-5776").join("609-676-4483");
referenceUpdates.set(210101, content);

for (const articleId of [1740029, 1770029]) {
  content = articleById.get(articleId).content;
  content = replaceRequired(content, "https://learn.microsoft.com/intune/apps/app-protection-policies-exception", "https://learn.microsoft.com/en-us/intune/app-management/protection/create-data-transfer-exceptions", articleId);
  referenceUpdates.set(articleId, content);
}

const azureMergeHeading = "## Add a New Data Disk When Expansion Is the Better Option";
content = articleById.get(1740001).content;
if (!content.includes(azureMergeHeading)) {
  content += `\n\n${azureMergeHeading}\n\nWhen the workload should be separated from the OS disk, attach and initialize a dedicated managed data disk instead of continuing to expand the existing volume.\n\n**Azure portal:**\n1. Open **Virtual machines** > the target VM > **Disks**.\n2. Select **Add data disk**.\n3. Create a managed disk or attach an approved existing disk, then select **Save**.\n\n**PowerShell:**\n\n\`\`\`powershell\n$vm = Get-AzVM -ResourceGroupName \"myResourceGroup\" -Name \"myVM\"\nAdd-AzVMDataDisk -VM $vm -Name \"myNewDisk\" -DiskSizeInGB 256 -CreateOption Empty -Lun 1\nUpdate-AzVM -ResourceGroupName \"myResourceGroup\" -VM $vm\n\`\`\`\n\n**Initialize and format in Windows:**\n1. Open **Disk Management**.\n2. Initialize the new disk as GPT unless the workload specifically requires MBR.\n3. Create a **New Simple Volume**, assign a drive letter, and format it as NTFS or ReFS according to the application requirement.\n\n**Initialize and format in Linux:**\n\n\`\`\`bash\nsudo lsblk\nsudo fdisk /dev/sdc\nsudo mkfs.ext4 /dev/sdc1\nsudo mkdir -p /mnt/data\nsudo mount /dev/sdc1 /mnt/data\n\`\`\`\n\nAdd the filesystem to \`/etc/fstab\` by UUID only after confirming the mount is correct, then update monitoring, backup, and ownership permissions for the new volume.\n`;
}
const azureMergedContent = content;

const mfaMergeHeading = "## When to Escalate";
content = articleById.get(210068).content.split("(727) 382-5776").join("609-676-4483");
if (!content.includes(mfaMergeHeading)) {
  content += `\n\n${mfaMergeHeading}\n\nEscalate to GigitekAI support when:\n- The user cannot access the **Security info** page.\n- The Authenticator QR code fails repeatedly after restarting the registration process.\n- The user has no valid verification method available.\n\nContact **support@gigitekai.com** or call **609-676-4483**.\n`;
}
const mfaMergedContent = content;

const preview = {
  mode: APPLY ? "apply" : "dry-run",
  affectedArticleCount: currentArticles.length,
  referenceArticleUpdateCount: referenceUpdates.size,
  mergeCanonicalIds,
  archiveMappingCount: plan.archiveMappings.length,
  preexistingRedirectCount: existingRedirects.length,
  backupPath,
};

if (!APPLY) {
  console.log(JSON.stringify(preview, null, 2));
  process.exit(0);
}

await db.transaction(async tx => {
  for (const [articleId, updatedContent] of referenceUpdates) {
    await tx.update(kbArticles).set({ content: updatedContent, updatedAt: new Date() }).where(eq(kbArticles.id, articleId));
  }

  await tx.update(kbArticles).set({ content: azureMergedContent, updatedAt: new Date() }).where(eq(kbArticles.id, 1740001));
  await tx.update(kbArticles).set({ content: mfaMergedContent, updatedAt: new Date() }).where(eq(kbArticles.id, 210068));

  for (const mapping of plan.archiveMappings) {
    const snapshot = articleById.get(mapping.archivedArticleId);
    await tx.insert(kbArticleRedirects).values({
      archivedArticleId: mapping.archivedArticleId,
      canonicalArticleId: mapping.canonicalArticleId,
      disposition: mapping.disposition,
      reason: mapping.reason,
      candidateNumbers: mapping.candidateNumbers,
      sourceSnapshot: snapshot,
    }).onDuplicateKeyUpdate({ set: {
      canonicalArticleId: mapping.canonicalArticleId,
      disposition: mapping.disposition,
      reason: mapping.reason,
      candidateNumbers: mapping.candidateNumbers,
      sourceSnapshot: snapshot,
      updatedAt: new Date(),
    }});
  }

  if (archiveIds.length) {
    await tx.update(kbArticles).set({
      isPublished: 0,
      ariaEnabled: 0,
      updatedAt: new Date(),
    }).where(inArray(kbArticles.id, archiveIds));
  }
});

const [archivedRows, redirectRows, canonicalRows] = await Promise.all([
  db.select({ id: kbArticles.id, isPublished: kbArticles.isPublished, ariaEnabled: kbArticles.ariaEnabled })
    .from(kbArticles).where(inArray(kbArticles.id, archiveIds)),
  db.select().from(kbArticleRedirects).where(inArray(kbArticleRedirects.archivedArticleId, archiveIds)),
  db.select({ id: kbArticles.id, isPublished: kbArticles.isPublished, ariaEnabled: kbArticles.ariaEnabled })
    .from(kbArticles).where(inArray(kbArticles.id, canonicalIds)),
]);

const failedArchives = archivedRows.filter(row => row.isPublished !== 0 || row.ariaEnabled !== 0);
const failedCanonicals = canonicalRows.filter(row => row.isPublished !== 1);
if (failedArchives.length || failedCanonicals.length || redirectRows.length !== archiveIds.length) {
  throw new Error(`Post-remediation verification failed: archives=${failedArchives.length}, canonicals=${failedCanonicals.length}, redirects=${redirectRows.length}/${archiveIds.length}`);
}

const result = {
  ...preview,
  completedAt: new Date().toISOString(),
  archivedArticleCount: archivedRows.length,
  redirectCount: redirectRows.length,
  publishedCanonicalCount: canonicalRows.length,
  hardDeletedArticleCount: 0,
};
await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, resultPath }, null, 2));
process.exit(0);
