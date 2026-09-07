type KbArticleLike = {
  id: number;
  isPublished: number;
  [key: string]: unknown;
};

type KbRedirectLike = {
  archivedArticleId: number;
  canonicalArticleId: number;
};

export function resolveKbArticlePayload<T extends KbArticleLike>(
  requestedId: number,
  directArticle: T | null | undefined,
  redirect: KbRedirectLike | null | undefined,
  canonicalArticle: T | null | undefined,
): (T & { canonicalId: number; redirectedFromId: number | null }) | null {
  if (directArticle?.isPublished === 1) {
    return { ...directArticle, canonicalId: directArticle.id, redirectedFromId: null };
  }
  if (!redirect || redirect.archivedArticleId !== requestedId) return null;
  if (!canonicalArticle || canonicalArticle.isPublished !== 1 || canonicalArticle.id !== redirect.canonicalArticleId) return null;
  return { ...canonicalArticle, canonicalId: canonicalArticle.id, redirectedFromId: requestedId };
}

export function resolveKbViewTarget(requestedId: number, redirectCanonicalId?: number | null) {
  return redirectCanonicalId ?? requestedId;
}
