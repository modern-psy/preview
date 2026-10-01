import fs from 'node:fs/promises';
import {renderDiploma} from '../../shared/academy/diploma-render.mjs';
import {renderTrialLectures} from '../../shared/academy/trial-lectures-render.mjs';
import {renderPricing} from '../../shared/academy/pricing-render.mjs';
import {renderLeadFormSection} from '../../shared/academy/lead-form-render.mjs';
import {renderAcademyShowcase} from '../../shared/academy/academy-showcase-render.mjs';
import {renderFaq} from '../../shared/academy/faq-render.mjs';

const read = async name => JSON.parse(await fs.readFile(new URL(`data/${name}.json`, import.meta.url), 'utf8'));
export async function renderLowerSections() {
  const [diploma, trial, pricing, form, contract, academy, faq] = await Promise.all(
    ['diploma', 'trial-lectures', 'pricing', 'lead-form', 'form-contract', 'academy-showcase', 'faq'].map(read));
  return [
    ['diploma', renderDiploma(diploma)],
    ['trial-lectures', renderTrialLectures(trial)],
    ['pricing', `<section class="section_pricing section-spacing_component is-inset" id="pricing" aria-labelledby="${pricing.id}-heading"><div class="padding-global"><div class="container-xlarge">${renderPricing(pricing)}</div></div></section>`],
    ['lead-form', renderLeadFormSection({...form, nativeMarker: contract.nativeMarker, agreementUrl: contract.agreementUrl, privacyUrl: contract.privacyUrl}, {id: 'cbt-oxford-form', formId: 'application-form'})
      .replace('section_lead-form section-spacing_component', 'section_lead-form section-spacing_component is-after-inset')],
    ['academy-showcase', renderAcademyShowcase(academy)],
    ['faq', renderFaq(faq)],
  ];
}
