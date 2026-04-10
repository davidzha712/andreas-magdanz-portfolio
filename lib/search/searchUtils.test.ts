import assert from "node:assert/strict";
import test from "node:test";

import {
  getMediaItemAnchorId,
  getMediaItemHref,
  getMediaItemSearchableText,
} from "./searchUtils.ts";

test("getMediaItemAnchorId creates a stable sanitized id", () => {
  assert.equal(
    getMediaItemAnchorId({
      _id: "drafts.media.article-01",
      mediaType: "press",
    }),
    "media-press-drafts-media-article-01"
  );
});

test("getMediaItemHref points to the media page anchor", () => {
  assert.equal(
    getMediaItemHref({
      _id: "video_123",
      mediaType: "video",
    }),
    "/media#media-video-video_123"
  );
});

test("getMediaItemSearchableText includes type, metadata, and description text", () => {
  assert.deepEqual(
    getMediaItemSearchableText({
      _id: "audio-1",
      title: "Campus Interview",
      source: "Deutschlandfunk",
      mediaType: "audio",
      date: "2024-03-12",
      descriptionText: "A long-form interview about the project.",
      externalUrl: "https://example.com/interview",
    }),
    [
      "Campus Interview",
      "Deutschlandfunk",
      "audio",
      "2024-03-12",
      "A long-form interview about the project.",
      "https://example.com/interview",
    ]
  );
});
