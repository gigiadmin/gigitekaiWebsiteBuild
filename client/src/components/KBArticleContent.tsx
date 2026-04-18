import { useMemo } from "react";
import { CodeBlockWithCopy } from "./CodeBlockWithCopy";
import { Streamdown } from "streamdown";

interface KBArticleContentProps {
  content: string;
}

/**
 * Renders KB article content with enhanced code blocks that have copy-to-clipboard functionality
 */
export function KBArticleContent({ content }: KBArticleContentProps) {
  // Parse content to identify code blocks and render them with copy buttons
  const renderedContent = useMemo(() => {
    // Split content by code block markers (```language ... ```)
    const parts: (string | { type: "code"; language: string; code: string })[] = [];
    let remaining = content;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before this code block
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add code block
      parts.push({
        type: "code",
        language: match[1] || "bash",
        code: match[2].trim(),
      });

      lastIndex = codeBlockRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts;
  }, [content]);

  return (
    <div className="space-y-4">
      {renderedContent.map((part, idx) => {
        if (typeof part === "string") {
          return (
            <div key={idx}>
              <Streamdown>{part}</Streamdown>
            </div>
          );
        } else if (part.type === "code") {
          return (
            <CodeBlockWithCopy
              key={idx}
              code={part.code}
              language={part.language}
            />
          );
        }
      })}
    </div>
  );
}
