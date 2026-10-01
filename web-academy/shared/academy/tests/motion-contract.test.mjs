import test from 'node:test';
import assert from 'node:assert/strict';
import {assertMotionContract} from '../motion-contract.mjs';

test('Approved motion settings and reduced-motion zero use milliseconds', () => {
  assert.doesNotThrow(() => assertMotionContract(`.page {
    --motion-duration: 150ms;
    --slider-duration: 400ms;
    --accordion-duration: 300ms;
  } @media (prefers-reduced-motion: reduce) {
    .page { --motion-duration: 0ms !important; }
  }`));
});

test('Reject the Oxford regression and incompatible duration units with a useful source label', () => {
  for (const token of ['motion', 'slider', 'accordion']) {
    for (const value of ['300', '0', '0.3s', '-100ms', 'fast']) {
      assert.throws(
        () => assertMotionContract(`.page { --${token}-duration: ${value} }`, 'styles.css'),
        /styles\.css: --.*-duration: .*use a non-negative duration in ms/
      );
    }
  }
});

test('Ignore documentation comments, token references and unrelated styles', () => {
  assert.doesNotThrow(() => assertMotionContract(`
    /* Incorrect: --motion-duration: 300; */
    .page { --some-count: 300; transition: opacity var(--motion-duration); }
  `));
});
