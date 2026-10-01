import {readFileSync} from 'node:fs';

/** Shared authoring/build contract. No browser runtime or CSS preprocessor needed. */
export const responsive = Object.freeze(JSON.parse(readFileSync(new URL('./responsive.json', import.meta.url), 'utf8')));
export const desktopMedia = `(min-width: ${responsive.desktop_min_px / responsive.css_reference_font_px}rem)`;

/** Reject the superseded tablet/desktop boundary in authored CSS and matchMedia. */
export function assertResponsiveContract(source, label = 'Academy source') {
  for (const match of source.matchAll(/\((min|max)-width\s*:\s*([\d.]+)(px|rem|em)\s*\)/g)) {
    const px = Number(match[2]) * (match[3] === 'px' ? 1 : responsive.css_reference_font_px);
    if ((px >= 991 && px <= 992) ||
        (match[1] === 'min' && px === responsive.tablet_max_px) ||
        (match[1] === 'max' && px === responsive.desktop_min_px)) {
      throw new Error(`${label}: ${match[0]} conflicts with tablet through ${responsive.tablet_max_px}px and desktop from ${responsive.desktop_min_px}px.`);
    }
  }
}
