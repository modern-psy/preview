# Problem section override

Figma Dev Mode node `611:1188` is the full second block. Nodes `611:1189`,
`611:1213`, and `611:1215` are nested detail references.

- Section begins after the global desktop `150px` inter-section spacing provided
  by the previous section and adds the same spacing after itself.
- Main stage: centered `width: 100%` with `max-width: 1200px`. When the viewport
  becomes narrower it shrinks inside `padding-global`. It preserves the desktop
  `1200:714` design ratio, `#DFDFDF` background, 0.5px
  `rgba(205,204,204,.8)` border, and 16px radius.
- Heading: Wix Madefor Text Bold, `48px/54px`, tracking `-1.2px`, `#332F41`.
  It wraps naturally from max-width; Figma `<br>` tags must not be copied.
- Visual row is centered inside the 1200px stage: it begins at 31.86% of stage
  height and 10.125% from the left, with a 79.5% width. It is a fluid two-column
  grid matching the two 469px Figma columns with a 16px gap.
- Left feed card: `#EAEAE7`, 12px radius, 4px backdrop blur, exact layered shadow.
- Feed header: `#A6A6A6`, 20px padding; heading `22px/28px` semibold.
- Feed body preserves `469:320`; caption `16px/24px`, `#5E5A6A`.
- Topic cards use content-driven height, 16px padding, 14px radius, 0.5px border,
  `18px/26px` semibold, and rotations `-0.6deg`, `1.14deg`, `0.26deg`.
- Profile uses the supplied Tilda PNG and a proportional clipped viewport rather
  than fixed width/height. The base image is sharp; a duplicated 3px-blur layer
  is masked from fully transparent at 28% to fully visible at the bottom, creating
  progressive blur without affecting the top of the profile.
- Bottom message group max-width is `713.626px`, with a user-adjusted 16px visual
  gap so the oppositely rotated left edges do not overlap. Both cards use 16px
  padding, 14px radius, and `18px/26px` centered text. Rotations are `-0.95deg`
  and `0.66deg`.
- No `<br>` tags: message wrapping is controlled only by container max-width.
- At narrow desktop (`<=1199px`), tablet, and mobile sizes the stage becomes
  content-driven; visual columns remain paired only above `768px`. From exactly
  `768px` downward, the left feed card occupies a full-width row above the
  full-width profile. The profile viewport is bottom-aligned and visually extends
  through the stage's bottom padding so the phone image touches the lower frame edge. The
  left feed card still respects the shared padding. Its three topic cards leave
  absolute positioning and enter normal document flow between the grey header
  and caption. Their wrapping therefore expands the parent instead of overlapping
  the caption at any intermediate width.
