# Bot section override

Figma Dev Mode node `611:1288` defines the section.

- Header max-width: 982px; header-to-content gap: 70px. The gray eyebrow sticker
  reads “Бот-помощник” without an emoji. Its desktop gap to the heading is 16px;
  the shared responsive 24px gap applies at `<=991px`. Heading-to-description
  gap: 28px.
- Heading: max-width 510px, 48px/54px Bold, tracking -1.2px. Description:
  max-width 812px, 22px/32px Regular. Wrapping is width-driven; no `<br>`.
- Desktop media grid uses the fluid Figma ratio `591fr / 833fr` and a 16px gap.
  Both cards reserve the 460px Dev Mode height with in-flow percentage-padding
  spacers (`460 / 591` and `460 / 833`) instead of relying only on the CSS
  `aspect-ratio` property. All visual children remain absolutely positioned over
  those spacers. This prevents real mobile browsers from collapsing both grid
  items to zero height while keeping dimensions fluid and ratio-derived.
- Telegram card uses `bg-4.webp`, the shared 500px grain, 38.5px background blur,
  and the exact Dev Mode multi-layer shadow on the interface image. The supplied
  Tilda WebP is already a finished vertical crop, so it keeps its native
  `1098 / 1395` ratio rather than repeating the Figma asset's internal crop.
- The Telegram interface moves only 20px vertically across the section scroll
  range. The card clips the motion, and reduced-motion restores the static state.
- The video comparison uses the authoritative synchronized, looping inline MP4
  pair from Tilda CDN recorded below: `video-before-optimiz.mp4` for the darkened
  before layer and `video-after-optimize.mp4` for the after layer. Both retain
  the exported design asset as a local poster fallback. The approved before-layer
  black overlay is 25%.
- Both Tilda CDN videos use muted inline autoplay and `preload="auto"`, while the
  document preconnects to `static.tildacdn.com`. This lets the browser buffer the
  complete comparison early without a duplicate JavaScript fetch or a separate
  `<link rel="preload">`. The MP4 files already contain H.264 video and AAC-LC
  audio tracks; there is no separate audio-codec asset to preload.
- The optimized Tilda replacements should reduce dual-decoder load on phones:
  export both files at exactly `1280×720`, constant 25fps, H.264 with `yuv420p`, a
  one-second keyframe interval, and MP4 Fast Start, keeping each file below 2MB.
  The after file keeps mono AAC-LC at 44.1kHz / 48–64kbps; remove the audio track
  entirely from the always-muted before file. Both exports must have identical
  duration, video frame count, first frame, and timestamps. Do not switch `src`
  until both final Tilda CDN URLs are supplied together.
- The matched optimized pair is authoritative: before uses
  `https://static.tildacdn.com/vide3266-6230-4665-b063-393530376261/video-before-optimiz.mp4`
  and after uses
  `https://static.tildacdn.com/vide3763-3036-4630-b163-373266326531/video-after-optimize.mp4`.
  Replace both URLs together if either asset changes again.
- The comparison video has no text overlay.
- The after layer is the master timeline. It owns autoplay, pause, seeking,
  looping, and audible playback; the before layer follows it. Use video-frame
  callbacks when supported, with `timeupdate` as the browser fallback. Drift up
  to 40ms is accepted. Between 40ms and 250ms, correct gently by adjusting the
  before layer's playback rate by no more than 6%. A hard `currentTime` seek is
  reserved for drift above 250ms or explicit master seeking; never seek the
  follower every frame. If the before layer emits `waiting`, pause the master and
  resume the pair only after the follower reaches `canplay`, so one layer cannot
  continue while the other is buffering. The sound-button click starts only the
  master video; it must not issue a redundant second `play()` call to the follower.
- Figma node `611:1302` adds a sound control at the lower right. Nodes `697:324`
  and `697:325` define its muted and playing states: a 40px translucent
  `rgba(238,238,239,.8)` surface, 10px radius, 5px backdrop blur, and a centered
  22px supplied Tilda SVG. Keep a 44px button hit area around the exact 40px
  visual surface. The comparison starts muted for autoplay; the after video is
  the only audio source so synchronized layers never play duplicate audio.
- The comparison range starts at 30.6%, matching Dev Mode. It supports pointer,
  touch, and keyboard input; the visible handle is 50px while the input hit area
  covers the whole card. The caption belongs only to the after layer: the opaque
  before video covers it. Pointer interaction has no outline; the focus ring is
  retained only for keyboard `:focus-visible`.
- When the comparison first becomes meaningfully visible, the divider moves 15
  percentage points to the right and returns to its starting position over 1.3
  seconds. This one-time affordance is cancelled immediately if the user starts
  interacting. After it finishes, fine-pointer hover adds a restrained 2.5-point
  rightward preview; touch devices do not depend on hover. Reduced-motion users
  skip the entrance movement and receive the static interactive control.
- Figma Dev Mode node `611:1308` defines the 50px handle. It contains two
  independent 16px by 18px `#332F41` triangles. Keep the user-supplied SVG path
  data inline rather than replacing the control with a font glyph or generic
  chevron.
- Feature cards use a four-column fluid grid. At exactly 1440px with 16px gaps,
  each resolves to the Figma 348px width. Height remains content-driven.
- Tablet stacks the media cards and uses two feature columns. Narrow mobile uses
  one column and keeps every media block proportional.
- The entire media grid remains statically visible and is excluded from the
  generic below-hero reveal selector. Do not initialize it with inline
  `opacity: 0` or a reveal transform: real mobile Safari and Chrome can leave the
  tall stacked grid hidden even though desktop responsive emulation displays it
  correctly. Initialization and the `pageshow` event must also clear stale inline
  opacity, transform, and will-change styles so a mobile back-forward cache cannot
  preserve an older hidden reveal state.
