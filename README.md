# Rodrigo Garro-Rivero — academic portfolio

A dependency-free, one-page academic website built with HTML, CSS, and
JavaScript. Its restrained editorial design uses a continuous geometric
background that changes as the visitor moves from the introduction to research
and teaching.

## Open the website

Open `index.html` in a browser. For the most reliable local behavior, open the
folder in VS Code and use a local-server extension if you already have one.

## Replace the placeholder content

All text that still needs your content is enclosed in square brackets. Search
`index.html` for `[` to move through each placeholder.

The editable content areas are:

- Opening introduction
- Publications
- Papers under review
- Work in progress
- Teaching statement and dated course entries
- Footer affiliation and email

## Add your CV

Save your CV as exactly:

```text
assets/cv.pdf
```

The CV button is already connected to that path and opens the PDF in a new
browser tab. You do not need to edit the HTML when the filename matches.

## Adjust the portrait crop

The original portrait is preserved at `assets/portrait.jpg`; CSS performs the
visible crop. In `styles.css`, find `.portrait-image` and adjust the second
percentage in this line:

```css
object-position: 50% 46%;
```

A lower percentage moves the visible crop upward; a higher percentage moves it
downward.

## Change the palette

The current warm paper, sage, and oxide palette was retained because it echoes
the shirt, stone, and warm architectural tones in the portrait. The principal
colors are variables at the beginning of `styles.css`:

```css
--paper: #f1eee6;
--ink: #171a1b;
--sage: #737863;
--oxide: #8a4737;
```

Changing them there updates the entire design.

## Background behavior

The fixed background is drawn on `visual-canvas` by `script.js`. One quiet,
opaque object gradually loses its surface to become a wireframe. Its edges then
separate into a compact vocabulary of line segments, junctions, occlusion
arrows, and convex/concave marks. The visual is decorative: all content remains
readable and navigable if JavaScript is unavailable. The site also respects the
visitor's reduced-motion preference.

## Publish with GitHub Pages

After replacing the placeholders and adding the CV, commit the folder contents
to a GitHub repository. The entry file must remain named `index.html`. You can
publish on a free `github.io` address first and connect a custom domain later.

Before publishing, confirm that no private research, student information,
passwords, unpublished drafts, or other confidential material is present.
