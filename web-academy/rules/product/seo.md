# Web Academy SEO rules

This project rule set is derived from:

- `/Users/glebstepanovich/Desktop/seo-master/knowledge-base/on-page-meta-rules.md`
- `/Users/glebstepanovich/Desktop/seo-master/projects/asp/`
- [Google Images SEO best practices](https://developers.google.com/search/docs/appearance/google-images)
- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)

Do not copy raw analytics, crawl exports, or client reports from `seo-master` into
this repository. Reuse only generalized rules and ASP-specific decisions that are
relevant to the current landing page.

## Image decision tree

Before writing metadata, classify every image:

1. **Meaningful content image** — photograph, screenshot, diagram, or illustration
   that contributes information. Use a concise contextual `alt`.
2. **Linked/action image** — if the image is the only meaningful content of a
   link, its `alt` describes the destination or action.
3. **Decorative image** — texture, blur, grain, background glow, duplicate effect
   layer, ornamental shape. Use `alt=""`; add `aria-hidden="true"` when helpful.

## Alt text

- Alt explains the image's relationship to nearby page content, not merely the
  file contents in isolation.
- Be specific and concise. Include relevant terms naturally only when they truly
  describe the image and its role.
- Do not keyword-stuff, repeat adjacent visible copy, or start with “image/photo
  of”. Screen readers already announce that it is an image.
- Do not omit the `alt` attribute. Decorative images use an intentionally empty
  value, not a missing attribute.
- Reused images may need different alt text in a different context. Duplicate
  visual-effect copies always use empty alt.
- For inline SVG, use an accessible `<title>` connected with `aria-labelledby`
  when the SVG communicates meaning. Decorative SVG uses `aria-hidden="true"`.

## Image title attribute

- Google does not require an HTML `title` attribute for image SEO. The essential
  attribute is useful `alt` text supported by nearby relevant content.
- Add `title` only when a supplementary tooltip helps a sighted user. It must not
  be an alt duplicate or a container for additional keywords.
- Decorative/effect images do not receive `title`.
- In Tilda, do not fill the image title field mechanically. Leave it empty unless
  the previous criterion is satisfied.

## Discoverability and performance

- Put indexable images in `<img src>` or `<picture>` with a fallback `<img src>`.
  Google does not index CSS background images as page images.
- Use short descriptive filenames when asset naming is under our control.
- Keep images close to relevant visible text.
- Preserve intrinsic dimensions or CSS `aspect-ratio` to prevent layout shift.
- Use responsive `srcset`/`sizes` when several image sizes are available; always
  retain a `src` fallback.
- Lazy-load below-the-fold images. Do not lazy-load the principal LCP image.
- Prefer supported, compressed formats such as WebP or AVIF while retaining
  sufficient visual quality.

## Page metadata inherited from seo-master

- Write metadata for the actual page and its concrete facts, not for a generic
  topic template.
- `<title>`: unique, descriptive, main intent early, normally 50–60 characters,
  never keyword-stuffed. Brand goes at the end when useful.
- Meta description: unique, normally 140–160 characters, combining benefit and
  concrete format/audience details without aggressive advertising.
- Keep `<title>`, H1, meta description, and Open Graph text purposeful rather than
  copying one field into every other field.
- For a published page, add absolute self-canonical without anchors, UTM, or
  tracking parameters.
- Minimum Open Graph set: title, description, image, URL, type, site name, locale,
  plus image width, height, and alt when known.

## Crawlable semantic structure

Follow [`semantic-accessibility.md`](semantic-accessibility.md) for the complete
semantic and accessibility contract. The SEO-sensitive subset is:

- Set the document language with `lang`; mark a fragment whose language changes.
- Use one clear `<main>` and one clear H1 for the page's primary topic. Heading
  levels describe the content hierarchy rather than visual size.
- Give each `<section>` a real topic and normally a heading; use a neutral `<div>`
  when no thematic section exists.
- Keep meaningful content in logical DOM order and as real text, not baked into
  images or created only after JavaScript runs.
- Use descriptive link text that remains understandable out of context.
- Use `ul`/`ol` for lists, `table` for tabular relationships, and `dl` for
  term-description pairs instead of recreating those structures with generic divs.
- Keep primary navigation and content available under progressive enhancement;
  custom components must not hide the only crawlable copy in Shadow DOM or runtime
  templates without a justified, tested reason.

## Delivery checklist

- [ ] Every `<img>` has an intentional `alt` value.
- [ ] Decorative/effect layers use empty alt and do not repeat content.
- [ ] Linked image alt describes its destination when needed.
- [ ] No keyword stuffing or duplicate alt/title pairs.
- [ ] Image titles exist only when they provide a useful supplementary tooltip.
- [ ] Important images use `<img src>`/`picture`, not only CSS backgrounds.
- [ ] Dimensions/aspect ratios prevent layout shift.
- [ ] `lang`, landmarks, H1 and heading hierarchy match the visible content.
- [ ] Meaningful text and links exist in logical HTML without requiring JavaScript.
- [ ] Metadata and canonical are finalized when the production Tilda URL is known.
