# Amen and reader messages — setting it up once

The prayers work already. Nothing in this file is needed to write them: open
**Write prayers.cmd**, type, save, and run **Update website.cmd**.

This file is only for the other half — the Amen button and the messages readers
leave. Those need somewhere to keep what visitors type, and GitHub Pages cannot
do that: it serves files and never receives anything. Firebase does the
receiving. It is free at this size, asks for no payment method, and you set it
up once.

Until you finish these steps the website behaves exactly as it does today. The
Amen button and the message form stay hidden. Nothing is broken while you wait,
so there is no hurry and no harm in stopping halfway.

Set aside about twenty minutes.

---

## 1. Create the project

Go to <https://console.firebase.google.com> and sign in with your Google
account. Choose **Create a project**.

Name it something you will recognise, such as `daily-devotions`. Turn Google
Analytics **off** — it is not needed and it adds tracking you do not want on a
devotional website. Create the project.

## 2. Register the website

On the project home page, click the **web** icon, `</>`.

Give it the nickname `devotions` and register it. Do **not** tick "Also set up
Firebase Hosting"; your website already has a home on GitHub Pages.

Firebase then shows a block of settings that looks like this:

```js
const firebaseConfig = {
  apiKey: "AIza…",
  authDomain: "daily-devotions-1234.firebaseapp.com",
  projectId: "daily-devotions-1234",
  storageBucket: "daily-devotions-1234.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123"
};
```

Open **assets/firebase-config.js** in Notepad and replace each `PASTE-…` value
with the matching one from that block. Keep the quotation marks and the commas.
Save the file.

Those six values are not secrets. Every Firebase website carries them in plain
sight. They say which project to talk to; what may actually be read or written
is decided in step 5.

## 3. Turn on the two sign-in methods

In the left menu choose **Build → Authentication**, then **Get started**.

On the **Sign-in method** tab, enable two providers:

- **Anonymous.** This is how a reader gets an identity without making an
  account. They type a name and a message, nothing more. Firebase quietly gives
  their browser a private identifier so the rules can say "one Amen each" and
  "one waiting message per devotion".
- **Google.** This is for you alone, to open the moderation page.

Then go to the **Settings** tab, find **Authorised domains**, and add:

```
daviessegera.github.io
```

Sign-in will refuse to work without this.

## 4. Create the database

Choose **Build → Firestore Database → Create database**.

Pick the location closest to most of your readers — `eur3` or `nam5` are fine
general choices. Start in **production mode**. Production mode refuses
everything until you write the rules, which is what you want; test mode would
leave the database open to the world for a month.

## 5. Publish the rules

Open the **Rules** tab. Delete what is there, then paste the whole of
**firestore.rules** from this folder.

One line still needs your own value:

```
&& request.auth.uid == 'PASTE-YOUR-FIREBASE-USER-ID';
```

You do not know that value yet. Leave it exactly as it is for now and press
**Publish**.

## 6. Collect your user ID

Commit and push this folder to GitHub the way you normally do, so the new files
are live. Then open:

```
https://daviessegera.github.io/devotions/admin/moderate.html
```

Sign in with Google. The page will tell you it cannot read anything yet — that
is correct, the rules do not know you — and it will show your **Firebase user
ID**, a long string of letters and numbers.

Copy it. Go back to the **Rules** tab, replace `PASTE-YOUR-FIREBASE-USER-ID`
with it, and press **Publish** again.

Reload the moderation page. It now works.

> The moderation page has to be opened from the live website. Opening the file
> directly from your computer by double-clicking it will not let you sign in,
> because Google only accepts sign-in from an approved web address.

## 7. Try it

Open any devotion on the live website. Beneath the prayer you should see the
Amen button, and beneath that the message form. Leave yourself a test message,
then approve it on the moderation page and reload the devotion. It should appear.

That is everything.

---

## Using it from day to day

Keep <https://daviessegera.github.io/devotions/admin/moderate.html> bookmarked.
Everything a reader sends waits there until you decide.

- **Publish** puts the message on the devotion page.
- **Discard** removes it for good.
- **Take down** removes something you published earlier.

Nothing a reader writes is visible to anyone — not to other readers, not even to
the person who wrote it — until you publish it. This is deliberate. An open
comment box on a Christian website attracts advertising, abuse, and argument,
and a queue means none of that ever reaches your readers.

Firebase does not tell you when something arrives, so look in every few days.

## What it costs

Nothing, on the free Spark plan, which needs no payment method. The daily
allowance is 50,000 document reads, 20,000 writes and 1 GiB stored.

In practice: reading one devotion costs one read for the Amen count plus one for
each published message on it. A devotion carrying twenty messages therefore
supports roughly two thousand readings a day before the allowance runs out, and
the allowance resets every day. If you ever approach it, thinning the older
messages on the busiest devotions brings it back down.

If the allowance is exhausted, the Amen button and messages simply stop loading
until the next day. The devotions themselves are unaffected — they are ordinary
files on GitHub Pages and owe Firebase nothing.

## If something goes wrong

**The Amen button and form never appear.** `assets/firebase-config.js` still
holds `PASTE-…` values, or the file was not committed. Open the page, press F12,
and read the Console tab; it will say what is missing.

**"auth/unauthorized-domain" when signing in.** Step 3 was missed. Add
`daviessegera.github.io` to Authorised domains.

**"permission-denied" on the moderation page.** The user ID in the rules does
not match the account you signed in with. Repeat step 6.

**A nuisance keeps sending messages.** Every one is held for approval, so no
reader sees them. To stop them reaching you at all, open **Authentication →
Sign-in method** and disable **Anonymous** for a while; the Amen button and the
form switch off, and published messages stay where they are.

## Turning it off again

Set the values in `assets/firebase-config.js` back to `PASTE-…`, run **Update
website.cmd**, and commit. The Amen button and the messages disappear and the
website is as it was. Nothing in the database is lost, and putting the values
back brings everything straight back.
