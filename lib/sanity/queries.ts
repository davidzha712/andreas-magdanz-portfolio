import { defineQuery } from "next-sanity";

export const siteSettingsQuery = defineQuery(
  `*[_type == "siteSettings"][0]{
    ...,
    homeHeroProject->{
      _id, title, slug, coverImage, year, location
    }
  }`
);

export const featuredProjectsQuery = defineQuery(
  `*[_type == "project" && isFeatured == true] | order(order asc, year desc){
    _id, title, slug, coverImage, year, location
  }`
);

export const allProjectsQuery = defineQuery(
  `*[_type == "project"] | order(order asc, year desc){
    _id, title, slug, coverImage, year, location, isFeatured
  }`
);

export const projectBySlugQuery = defineQuery(
  `*[_type == "project" && slug.current == $slug][0]{
    ...,
    "relatedExhibitions": *[_type == "exhibition" && references(^._id)] | order(year desc),
    "relatedPublications": *[_type == "publication" && references(^._id)] | order(year desc)
  }`
);

export const allExhibitionsQuery = defineQuery(
  `*[_type == "exhibition"] | order(year desc){
    ...,
    relatedProject->{ _id, title, slug }
  }`
);

export const allPublicationsQuery = defineQuery(
  `*[_type == "publication"] | order(year desc)`
);

export const allMediaItemsQuery = defineQuery(
  `*[_type == "mediaItem"] | order(date desc)`
);

export const allCVEntriesQuery = defineQuery(
  `*[_type == "cvEntry"] | order(year desc)`
);
