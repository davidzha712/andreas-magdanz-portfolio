import { defineQuery } from "next-sanity";

export const siteSettingsQuery = defineQuery(
  `*[_type == "siteSettings"][0]{
    ...,
    "siteDescription": select(
      $locale == "en" => coalesce(siteDescriptionEn, siteDescription),
      siteDescription
    ),
    "artistBio": select(
      $locale == "en" => coalesce(artistBioEn, artistBio),
      artistBio
    ),
    "teachingHistory": select(
      $locale == "en" => coalesce(teachingHistoryEn, teachingHistory),
      teachingHistory
    ),
    "universityInfo": select(
      $locale == "en" => coalesce(universityInfoEn, universityInfo),
      universityInfo
    ),
    "heroVideoUrl": heroVideo.asset->url,
    heroVideoPosition,
    "ogImageUrl": ogImage.asset->url + "?w=1200&h=630&fit=crop&auto=format",
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
    "artistStatement": select(
      $locale == "en" => coalesce(artistStatementEn, artistStatement),
      artistStatement
    ),
    "description": select(
      $locale == "en" => coalesce(descriptionEn, description),
      description
    ),
    "relatedExhibitions": *[_type == "exhibition" && references(^._id)] | order(year desc),
    "relatedPublications": *[_type == "publication" && references(^._id)] | order(year desc)
  }`
);

export const allExhibitionsQuery = defineQuery(
  `*[_type == "exhibition"] | order(year desc){
    ...,
    "country": select(
      $locale == "en" => coalesce(countryEn, country),
      country
    ),
    "description": select(
      $locale == "en" => coalesce(descriptionEn, description),
      description
    ),
    relatedProject->{ _id, title, slug }
  }`
);

export const allPublicationsQuery = defineQuery(
  `*[_type == "publication"] | order(year desc){
    ...,
    "description": select(
      $locale == "en" => coalesce(descriptionEn, description),
      description
    )
  }`
);

export const allMediaItemsQuery = defineQuery(
  `*[_type == "mediaItem"] | order(date desc){
    ...,
    "title": select(
      $locale == "en" => coalesce(titleEn, title),
      title
    ),
    "description": select(
      $locale == "en" => coalesce(descriptionEn, description),
      description
    ),
    "pdfUrl": pdfFile.asset->url
  }`
);

export const allCVEntriesQuery = defineQuery(
  `*[_type == "cvEntry"] | order(year desc){
    ...,
    "title": select(
      $locale == "en" => coalesce(titleEn, title),
      title
    ),
    "description": select(
      $locale == "en" => coalesce(descriptionEn, description),
      description
    )
  }`
);
