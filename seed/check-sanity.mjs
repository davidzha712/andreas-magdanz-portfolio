import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'b8e16q3y', dataset: 'production',
  apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
  perspective: 'published',
});

const [items, settings, vCount, aCount, pCount] = await Promise.all([
  client.fetch('*[_type == "mediaItem"] | order(date desc)[0..9]{ _id, title, mediaType, embedUrl, externalUrl, pdfUrl, "hasPdf": defined(pdfFile), source }'),
  client.fetch('*[_type == "siteSettings"][0]{ heroImage, artistPortrait, heroVideos }'),
  client.fetch('count(*[_type == "mediaItem" && mediaType == "video"])'),
  client.fetch('count(*[_type == "mediaItem" && mediaType == "audio"])'),
  client.fetch('count(*[_type == "mediaItem" && mediaType == "press"])'),
]);

console.log('=== Media counts ===');
console.log('video:', vCount, '| audio:', aCount, '| press:', pCount);
console.log('\n=== Sample media items ===');
for (const i of items) {
  const title = (i.title || '').substring(0, 45);
  console.log('[' + i.mediaType + '] ' + title);
  if (i.embedUrl) console.log('  embedUrl:', i.embedUrl.substring(0, 70));
  if (i.externalUrl) console.log('  externalUrl:', i.externalUrl.substring(0, 70));
  if (i.pdfUrl) console.log('  pdfUrl: HAS URL -', i.pdfUrl.substring(0, 70));
  else console.log('  pdfUrl: null');
}
console.log('\n=== SiteSettings ===');
console.log('heroImage:', settings?.heroImage ? 'SET ref=' + (settings.heroImage.asset?._ref || 'unknown').substring(0,25) : 'NOT SET');
console.log('artistPortrait:', settings?.artistPortrait ? 'SET' : 'NOT SET');
console.log('heroVideos:', settings?.heroVideos?.length ?? 0, 'videos');
