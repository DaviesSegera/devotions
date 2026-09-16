# A New Beginning — Daily Christian Devotions

[Read the devotions](https://daviessegera.github.io/devotions/)

Bible devotions prepared by Dr. Davies Rene Segera, with reflections alongside
Ellen G. White’s writings and videos from **I Can Still Believe**.
Scripture quotations are from the New Living Translation.

## What readers can do

- Read each complete devotion, its key takeaways, and sources.
- Browse by Bible passage or eight spiritual topics; search by topic, title, or person.
- Continue with related readings.
- Watch each Short or full film on its own page, or beneath the devotion.
- Share a devotion, bookmark the homepage, or follow new posts using its RSS feed.

## Daily publishing: desktop, then commit

The website remains plain HTML on GitHub Pages. There is no package installation,
paid service, database, or new hosting account. Node.js 18 or newer is only needed
on the desktop to run the update helper; visitors do not need it.

### Editing an existing devotion

1. Edit its `.html` page **between** `DEVOTION CONTENT START` and
   `DEVOTION CONTENT END`. These markers surround the Scripture, original
   reflection, takeaways, and sources. Leave the markers in place.
2. If the title, summary, topics, passage, reading time, or video changed, update
   that devotion’s entry in `devotions.json` as well.
3. Double-click **Update website.cmd**. It updates the website and checks it.
4. Commit **all** changes in this folder, including `assets`, `topics`, `watch`,
   the XML files, and `devotions.json`, using your normal GitHub workflow.

When publishing this folder as the repository root, its `index.html` must be at
the root of the repository, as before. Do not add an extra `github-site` level
inside the repository.

### Adding a new devotion

1. Copy an existing devotion page to a new stable filename such as
   `trusting-god-in-the-wait.html`.
2. Replace the authored content between the two markers with the new devotion,
   keeping the existing content classes for styling.
3. Add an entry in `devotions.json`, using a current entry as the example.
   Supply its unique slug (filename without `.html`), title, Bible passage,
   subject, testament (`old` or `new`), reading time, key verse/reference,
   a short original summary, topic slugs, and verified YouTube IDs/titles.
   Put the entry in biblical order among the existing entries.
4. Set the top-level `latest` value to the new slug. If you know the actual
   website publication date, add `publishedDate` as `YYYY-MM-DD` to the entry.
5. For each video, set `kind` to `short` or `film`. Add `uploadDate` and
   `uploadDateSource` only when the actual public YouTube date is verified.
   Omit these fields if unknown. File creation and editing dates are not
   publication dates. A YouTube page URL is not an MP4 content URL.
6. Double-click **Update website.cmd**, review the result, and commit all changes.

The helper automatically updates the homepage, topic collections, related
readings, watch pages, search information, sitemap, video sitemap, and feed.
Do not edit those generated pages by hand; the next update rebuilds them.
Your devotion content inside the markers is preserved exactly.

If working with an assistant, this request is sufficient:

> Add my new devotion and its verified YouTube video to github-site. Keep its
> Scripture, reflection, takeaways, and sources intact. Update devotions.json,
> select relevant existing topics, set the latest devotion, then run the update
> helper and validation before I commit. Do not invent publication dates.

### Commands, if preferred

```text
node tools/update-site.cjs
node tools/validate-site.cjs
```

`node tools/update-site.cjs --check` checks generated pages without writing files.
New unregistered `.html` files are reported so they cannot silently be omitted
from the sitemap.

### Design and functionality

- `assets/base.css`: original shared visual design.
- `assets/discover.css`: topic browsing, watch pages, and reading additions.
- `assets/theme.js`: restores night reading before the page renders.
- `assets/site.js`: night mode, reading progress, search, and sharing.
- `assets/community.css`: the prayer, the Amen button, and readers' messages.
- `assets/community.js`: shows the Amen count and approved messages, and sends new ones for approval.
- `assets/firebase-config.js`: where the Firebase settings go. See SETUP-COMMENTS.md.
- `tools/update-site.cjs`: generates the website from the catalog and authored pages.
- `tools/validate-site.cjs`: checks routes, metadata, video information, and generation.
- `tools/prayer-editor.cjs`: the editor behind **Write prayers.cmd**.
- `admin/moderate.html`: your private page for approving readers' messages.

Existing devotion URLs are unchanged. Links already shared continue to work.
Historical dates that were not known were left unspecified. Video structured
data is emitted only when its required upload date has a documented source;
the video sitemap includes all watch pages regardless.

The RSS feed contains stable entry links and summaries, with the latest devotion
first. It does not invent a chronological order for undated historical readings.

## Search visibility and measurement

Follow [SEARCH-CONSOLE.md](SEARCH-CONSOLE.md) once the changes are live. Search
Console checks which pages Google has indexed and which searches bring readers.
No analytics account or tracking ID has been configured.

## Writing the prayer on a devotion

Double-click **Write prayers.cmd**. A page opens in your browser listing every
devotion, with a gold mark beside those that already have a prayer.

Choose one, type the prayer, and leave a blank line between paragraphs. What you
type is shown beneath the box exactly as readers will see it. Then either:

- **Save prayer**, and run **Update website.cmd** yourself afterwards; or
- **Save, then update the website**, which does both in one step.

Either way, commit the folder as usual to publish. Ctrl+S saves without reaching
for the mouse. To take a prayer down, clear the box and save.

The prayer is kept in `devotions.json` as a `prayer` value beside that
devotion's summary, and appears at the close of the reading, before the video.
It is ordinary page text, so it is read by search engines and carried in the
feed like the rest of the devotion. A devotion without a prayer simply does not
show that section.

The editor is served by your own computer to your own computer, behind a key
that changes each time it starts. Nothing leaves the machine. Close the window
and press Ctrl+C in the black window when you have finished.

## Amen, and messages from readers

Beneath each prayer is an **Amen** button that counts how many people have
prayed it, and below that a box where a reader can leave a message using only a
name — no account, no sign-in.

**Nothing a reader writes appears until you approve it.** Unapproved messages
cannot be read by anyone but you, not even by whoever wrote them. You approve
them at `admin/moderate.html`, which is kept out of the sitemap and out of
search results.

This part uses the free Firebase project **A New Beginning Devotions**, because
GitHub Pages can serve files but cannot receive anything a visitor types. Its
web app, sign-in methods, authorised domain, database, and owner account are
configured. `firestore.rules` is the source copy of the published security
rules. **SETUP-COMMENTS.md** records the setup for future maintenance.

## Licence and use

Prepared by Dr. Davies Rene Segera. Free to read, and free to share.

*Soli Deo Gloria*
