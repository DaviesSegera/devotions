# Help Google discover the devotions

The website changes make the content easier to discover and understand. Google
Search Console lets you check what Google actually indexes and how readers find
the site. Indexing and rankings are not guaranteed and may take time.

## One-time setup after publishing

1. Open [Google Search Console](https://search.google.com/search-console/about)
   and sign in with the Google account you want to use for this website.
2. Add a **URL-prefix property** with the exact address:
   `https://daviessegera.github.io/devotions/`.
   Use URL-prefix because you do not control the `github.io` domain’s DNS.
3. Choose **HTML-tag verification**. Copy the token inside the `content` attribute
   of Google’s tag into a top-level `googleSiteVerification` string in
   `devotions.json`. Run the update helper, commit the changes, wait for the
   homepage to update, then select **Verify**. The helper preserves this tag on
   future updates. Keep the token in the catalog permanently.
4. In **Sitemaps**, submit `sitemap.xml` and `video-sitemap.xml`. Their full URLs are:
   - https://daviessegera.github.io/devotions/sitemap.xml
   - https://daviessegera.github.io/devotions/video-sitemap.xml
5. Inspect the homepage URL, the latest devotion, and its watch page. Use the
   live URL test and request indexing if offered. Start with these representative
   pages; Google can discover the others from the sitemaps and links.

This GitHub project lives under `/devotions/`. A `robots.txt` placed inside this
folder would not control crawling: Google reads the hostname-root file at
`https://daviessegera.github.io/robots.txt`. A missing robots file does not block
indexing. Submit the sitemaps directly rather than adding a misleading project
robots file. If you later manage the hostname-root site, its robots file can
advertise these two sitemap URLs.

## Bing setup

Open [Bing Webmaster Tools](https://www.bing.com/webmasters/) and add this same
website. If offered, import the verified Google Search Console property.
For HTML-meta verification, copy only the content value of the `msvalidate.01`
tag into a top-level `bingSiteVerification` string in `devotions.json`.
Run **Update website.cmd**, publish, then verify in Bing. Keep the token in the
catalog. Submit the same two sitemap URLs there.

## Weekly measurement

- **Page indexing:** check that new devotion and topic pages are being indexed.
- **Search performance:** compare clicks, impressions, search terms, and countries
  over 28 days. Notice specific needs readers search for, such as prayer during
  difficulty or hope after disappointment.
- **Video indexing:** inspect watch pages separately from article pages. On watch
  pages, the video is the main content. Article pages also contain the video,
  but their main purpose is reading the devotion.
- **YouTube Studio:** check views and watch time from external traffic, including
  this website. Search Console does not measure embedded video plays, reading
  completion, or returning visitors; site analytics would be a separate setup.

Page clicks and video counts do not directly measure spiritual growth. Use these
reports to see whether people can find and use the readings, alongside feedback
people choose to share with you.

## Daily habits that support the site’s purpose

- Write a brief, accurate summary of what a devotion helps a reader reflect on.
  Use everyday language naturally; avoid repeating search phrases artificially.
- Keep Bible passages and source citations clear. Choose two or three genuinely
  relevant topics rather than assigning every devotion to every topic.
- Share the specific devotion URL with a short personal introduction in communities
  where sharing is welcome. Invite readers to reflect and share thoughtfully.
- Where the YouTube format supports clickable links, link to the matching devotion
  from your video description. Use your channel profile link to help Shorts viewers
  reach the website. Check the link opens from the audience’s view.
- For a new video, record the actual public YouTube publication date so complete
  video structured data can be included automatically. Do not change historical
  dates to make content appear new.

## References

- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Verify site ownership](https://support.google.com/webmasters/answer/9008080)
- [Video SEO best practices](https://developers.google.com/search/docs/appearance/video)
- [Video sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps)
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Video structured data](https://developers.google.com/search/docs/appearance/structured-data/video)
