# A New Beginning — Daily Devotions

Devotions from the Word of God, read alongside the writings of Ellen G. White.
Scripture is quoted from the New Living Translation.

### 📖 Read them here → **https://daviessegera.github.io/devotions/**

---

## What is in this repository

Thirty-two devotions, each a single self-contained page, plus the index that lists them.

Every devotion page ends with a **Watch it** panel: the Short's own artwork as a
click-to-play player (nothing from YouTube loads until it is tapped), the video's
title as it appears on the channel, and buttons that open it in the YouTube app.
The two devotions that also have a long film show the film beneath the Short.
The index leads with the latest devotion and lists every devotion with its
artwork. A night-reading mode (the moon button in the top bar) is remembered
across the whole site.

Pages are named after the devotion, in lower case with hyphens — for example
`remember-me.html`, `when-thomas-doubted.html`. The index at `index.html` groups
them by testament and orders them by the book of the Bible the account comes from,
with a search box for finding one by title, person or passage.

## Adding a new devotion

1. Copy the new reading page into this repository, renamed to lower case with
   hyphens and no apostrophes — `when-god-sends-a-peacemaker.html`, not
   `when-god-sends-a-peacemaker-reading.html`.
2. Give it the site's frame: copy the `<head>` styles, the top bar, the hero band
   and the footer from any existing page, keeping the new devotion's own content
   between `<section class="verse-card">` and the Sources paragraph.
3. Build its Watch it panel by copying an existing `<div class="watch">` block and
   changing the YouTube video ID (it appears three times: `data-id`, the artwork
   URL and the button link) and the video's title.
4. Add a card for it in `index.html`, in the right testament section and in
   biblical order. Copy an existing card and change the link, the video ID in the
   artwork URL, the passage, the title, the subject line, the key verse and its
   reference. Update the `data-find` attribute too, since that is what the search
   box reads. Move the "Latest devotion" block to the new devotion.
5. Change the count in the standfirst and in the search box's caption if the
   total is no longer thirty-two.

GitHub Pages rebuilds the site automatically, usually within a minute. The address
never changes, so links already shared with the church keep working.

## Sharing

The address can be sent to the church WhatsApp group as it is. A single devotion
can be shared on its own — every page stands alone and needs nothing else to
display correctly.

## Licence and use

Prepared by Dr. Davies Rene Segera. Free to read, and free to share.

*Soli Deo Gloria*
