# Live calls section override

Figma Dev Mode node `611:1355` defines the section.

- The whole section is centered at the same 1200px maximum width as the first CTA
  and host card. Header-to-layout gap: 70px.
- Header max-width: 982px. Heading max-width: 506px, 48px/54px Bold, tracking
  -1.2px. Description: 22px/32px. Text wraps from width; no `<br>`.
- Desktop layout uses fluid `591fr / 469fr` columns with a proportional gap that
  resolves to 138px at the maximum section width.
- The six-step list is content-driven. A shared 2px line runs from the first
  marker to `bottom: 0` of the list, so it always reaches the dynamic block edge.
  Its vertical gradient fades from black to transparent. The final marker switches
  to white with a 2px black border.
- With motion enabled, scroll progress replaces the static line with a 2px track
  that begins growing as the timeline enters the lower 90% of the viewport and
  runs from the first marker to the last. Line growth is calculated from actual
  viewport pixels: one pixel of timeline travel past the 90% viewport activation
  line adds one pixel to the progress line. The original black-to-transparent
  track remains visible from the first marker to the dynamic bottom of the list;
  it is never shortened to the final marker. Each step copy fades/slides in at
  the exact pixel where the progress line reaches its marker. Reached steps and
  line progress never reverse, so the sequence runs only once per page load.
  Marker circles remain fully opaque and layered above the track so the line never
  shows through them. Reduced motion and a failed Motion import retain the complete
  static Figma timeline.
- Step headings: 28px/34px Bold. Copy: 18px/26px. Internal copy gap: 16px;
  step-to-step gap: 20px.
- The supplied group-call image keeps its native `1500 / 3248` ratio, equivalent
  to the Figma `469 / 1016` frame. No fixed height is used.
- Tablet/mobile stacks the image after the timeline. Narrow mobile reduces type
  while preserving the 40px touch-safe visual markers.
