interface MediaItemLike {
  _id: string;
  mediaType: string;
}

interface SearchableMediaItemLike extends MediaItemLike {
  title: string;
  source: string;
  date?: string;
  descriptionText?: string | null;
  externalUrl?: string | null;
}

function sanitizeAnchorSegment(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "item";
}

export function getMediaItemAnchorId(item: MediaItemLike): string {
  return `media-${sanitizeAnchorSegment(item.mediaType)}-${sanitizeAnchorSegment(item._id)}`;
}

export function getMediaItemHref(item: MediaItemLike): string {
  return `/media#${getMediaItemAnchorId(item)}`;
}

export function getMediaItemSearchableText(
  item: SearchableMediaItemLike
): string[] {
  return [
    item.title,
    item.source,
    item.mediaType,
    item.date ?? "",
    item.descriptionText ?? "",
    item.externalUrl ?? "",
  ].filter(Boolean);
}
