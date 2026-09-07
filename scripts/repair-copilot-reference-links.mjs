/** Replace retired official Microsoft URLs in the three affected generated articles. */
import fs from "node:fs/promises";
import path from "node:path";

const articlesDir = process.argv[2] || "/home/ubuntu/gigitekai-kb-copilot/articles/raw";
const replacementsById = {
  22: [
    {
      from: "https://support.microsoft.com/en-us/office/create-a-summary-of-your-document-with-copilot-in-word-3b32039a-5264-42b1-af0a-81c4e9768656",
      to: "https://support.microsoft.com/en-us/word/copilot/create-a-summary-of-your-document-with-copilot-in-word",
    },
    {
      from: "https://support.microsoft.com/en-us/office/welcome-to-copilot-in-word-21d4692e-399a-4841-a67b-1662580a6d71",
      to: "https://support.microsoft.com/en-us/word/welcome-to-copilot-in-word",
    },
    {
      from: "https://support.microsoft.com/en-us/office/copilot-tutorial-find-references-in-word-file-7e155b46-0b1d-4591-9e5c-154949511674",
      to: "https://support.microsoft.com/en-us/word/copilot-tutorial-find-references-in-word-file",
    },
  ],
  26: [
    {
      from: "https://support.microsoft.com/en-us/office/get-started-with-copilot-in-excel-48135ce0-424b-4869-9529-577717088b22",
      to: "https://support.microsoft.com/en-us/excel/copilot/get-started-with-copilot-in-excel",
    },
    {
      from: "https://support.microsoft.com/en-us/office/generate-formulas-with-copilot-in-excel-110034a3-c598-430f-b788-b22394d2c882",
      to: "https://support.microsoft.com/en-us/excel/copilot/data-insights-with-copilot-in-excel",
      fromTitle: "Generate formulas with Copilot in Excel",
      toTitle: "Get data insights with Copilot in Excel",
    },
    {
      from: "https://support.microsoft.com/en-us/office/analyze-data-with-copilot-in-excel-0e427d14-3882-4211-a831-295b92d6e3f5",
      to: "https://support.microsoft.com/en-us/excel/copilot/frequently-asked-questions-about-copilot-in-excel",
      fromTitle: "Analyze data with Copilot in Excel",
      toTitle: "Frequently asked questions about Copilot in Excel",
    },
  ],
  38: [
    {
      from: "https://learn.microsoft.com/en-us/viva/insights/copilot-dashboard",
      to: "https://learn.microsoft.com/en-us/viva/insights/org-team-insights/copilot-dashboard",
    },
  ],
};

for (const [idText, replacements] of Object.entries(replacementsById)) {
  const id = Number(idText);
  const filePath = path.join(articlesDir, `article-${String(id).padStart(3, "0")}.json`);
  const article = JSON.parse(await fs.readFile(filePath, "utf8"));
  let content = article.content;
  for (const replacement of replacements) {
    content = content.split(replacement.from).join(replacement.to);
    if (replacement.fromTitle && replacement.toTitle) content = content.split(replacement.fromTitle).join(replacement.toTitle);
    for (const reference of article.references || []) {
      if (reference.url === replacement.from) reference.url = replacement.to;
      if (replacement.fromTitle && reference.title === replacement.fromTitle) reference.title = replacement.toTitle;
    }
  }
  article.content = content;
  await fs.writeFile(filePath, `${JSON.stringify(article, null, 2)}\n`);
}

console.log(JSON.stringify({ repairedArticleIds: Object.keys(replacementsById).map(Number), replacementCount: Object.values(replacementsById).flat().length }));
