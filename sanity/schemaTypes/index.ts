import { project } from "./documents/project";
import { exhibition } from "./documents/exhibition";
import { publication } from "./documents/publication";
import { mediaItem } from "./documents/mediaItem";
import { cvEntry } from "./documents/cvEntry";
import { siteSettings } from "./documents/siteSettings";
import { projectImage } from "./objects/projectImage";
import { blockContent } from "./objects/blockContent";

export const schemaTypes = [
  // Documents
  project,
  exhibition,
  publication,
  mediaItem,
  cvEntry,
  siteSettings,
  // Objects
  projectImage,
  blockContent,
];
