/**
 * KB Usability Enhancements Component
 * Provides: Text enlargement, email sharing, and portal integration
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ZoomIn, ZoomOut, Mail, Share2, Copy, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface KbArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string | null;
}

interface KbEnhancementsProps {
  article: KbArticle;
  onClose?: () => void;
}

/**
 * KB Text Enlargement Component
 * Allows users to increase/decrease text size for better readability
 */
export const KbTextEnlargement: React.FC<{ content: string }> = ({ content }) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 80));
  };

  const handleReset = () => {
    setZoomLevel(100);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Zoom Controls */}
      <div className="flex items-center gap-2 p-3 bg-background border border-border rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 80}
          title="Decrease text size"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <span className="text-sm font-medium min-w-12 text-center">
          {zoomLevel}%
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 150}
          title="Increase text size"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs"
        >
          Reset
        </Button>
      </div>

      {/* Content with Zoom Applied */}
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        style={{
          fontSize: `${zoomLevel}%`,
          lineHeight: '1.6',
          padding: '1rem',
          backgroundColor: 'var(--background)',
          borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
};

/**
 * KB Email Sharing Component
 * Allows users to share KB articles via email
 */
export const KbEmailSharing: React.FC<{ article: KbArticle }> = ({ article }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleShare = async () => {
    if (!recipientEmail) {
      alert('Please enter a recipient email address');
      return;
    }

    setIsLoading(true);
    try {
      // Call tRPC endpoint to send email
      await trpc.kb.emailArticle.useMutation().mutateAsync({
        articleId: article.id,
        articleTitle: article.title,
        articleContent: article.content,
        articleCategory: article.category,
        recipientEmail,
      });

      setIsSent(true);
      setTimeout(() => {
        setIsOpen(false);
        setRecipientEmail('');
        setMessage('');
        setIsSent(false);
      }, 2000);
    } catch (error) {
      alert('Failed to send email. Please try again.');
      console.error('Share error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Mail className="w-4 h-4" />
        Share via Email
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share KB Article</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Article</label>
              <p className="text-sm text-muted-foreground mt-1">{article.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Recipient Email</label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message (optional)</label>
              <Textarea
                placeholder="Add a personal message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={isLoading || !recipientEmail}
              >
                {isSent ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Sent!
                  </>
                ) : isLoading ? (
                  'Sending...'
                ) : (
                  'Send'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * KB Copy to Clipboard Component
 * Allows users to copy article link or content
 */
export const KbCopyLink: React.FC<{ article: KbArticle }> = ({ article }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    const articleUrl = `${window.location.origin}/kb/${article.id}`;
    navigator.clipboard.writeText(articleUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopyLink}
      className="gap-2"
    >
      {isCopied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy Link
        </>
      )}
    </Button>
  );
};

/**
 * KB Portal Integration Component
 * Shows KB articles in support portal when creating tickets
 */
export const KbPortalIntegration: React.FC<{ searchQuery?: string }> = ({ searchQuery }) => {
  const [suggestedArticles, setSuggestedArticles] = useState<KbArticle[]>([]);
  const { data: searchResults, isLoading } = trpc.kb.search.useQuery(
    { query: searchQuery || '' },
    { enabled: !!searchQuery && searchQuery.length >= 3 }
  );

  React.useEffect(() => {
    if (searchResults) {
      setSuggestedArticles(searchResults.slice(0, 3));
    }
  }, [searchResults]);

  if (!suggestedArticles.length) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
      <div className="flex items-start gap-3">
        <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
            Related KB Articles
          </h3>
          <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
            Before creating a ticket, check if your issue is already covered in our knowledge base:
          </p>
          <ul className="space-y-2">
            {suggestedArticles.map((article) => (
              <li key={article.id}>
                <a
                  href={`/kb/${article.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                >
                  <span>→</span>
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * KB Enhancements Toolbar Component
 * Combines all KB enhancement features
 */
export const KbEnhancementsToolbar: React.FC<KbEnhancementsProps> = ({ article }) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg border border-border">
      <KbCopyLink article={article} />
      <KbEmailSharing article={article} />
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => window.print()}
      >
        <span>🖨️</span>
        Print
      </Button>
    </div>
  );
};

export default KbEnhancementsToolbar;
