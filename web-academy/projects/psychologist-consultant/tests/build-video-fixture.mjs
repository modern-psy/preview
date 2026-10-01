import fs from 'node:fs/promises';
import {renderReviewCard} from '../../../shared/academy/reviews-render.mjs';
const data = JSON.parse(await fs.readFile(new URL('../data/reviews.json', import.meta.url), 'utf8'));
const item = data.items.find(item => item.type === 'video');
const card = renderReviewCard({...item, image: '../' + item.image}, 'video-fixture').replaceAll('src="assets/', 'src="../assets/');
const secondCard = renderReviewCard(data.items.find(item => item.id === 'video-elena'), 'second-video-fixture').replaceAll('src="assets/', 'src="../assets/');
const html = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Video review checks</title>
${['components','review-controls','review-card'].map(name => `<link rel="stylesheet" href="../../../shared/academy/${name}.css?v=video-3">`).join('')}
<link rel="stylesheet" href="../styles.css"><script src="../../../shared/academy/review-card.js?v=video-3" defer></script>
<body><main class="academy-page psychologist-consultant-page"><button id="run" type="button">Проверить видео</button><output id="results">Готово к проверке</output><div data-slider-component style="display:flex;gap:1rem;max-width:48rem">${card}${secondCard}</div></main>
<script>
document.querySelector('#run').addEventListener('click', async () => {
 const results = [], output = document.querySelector('#results');
 const check = (ok, label) => { if (!ok) throw Error(label); results.push('PASS '+label); output.textContent = results.join(' | '); };
 const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
 const until = async fn => { for(let i=0;i<100;i++){if(fn())return; await wait(100);} throw Error('Media wait timed out'); };
 const card = document.querySelector('[data-review-video-card]'), video = card.querySelector('video'), button = card.querySelector('button');
 try {
  check(video.paused && !video.controls && !button.hidden, 'initial state: no autoplay, custom control ready');
  button.click(); await until(() => video.currentTime > .1);
  check(!video.paused && button.hasAttribute('data-playing'), 'play advances real media and displays pause');
  button.click(); await wait(100); const time = video.currentTime; await wait(200);
  check(video.paused && video.currentTime === time && !button.hasAttribute('data-playing'), 'pause holds the current frame');
  const poster = card.querySelector('[data-review-video-poster]');
  check(poster.hidden, 'poster stays hidden immediately after pause');
  await wait(2400);
  check(!poster.hidden && video.currentTime === time, 'poster returns after 2.5 seconds without resetting time');
  button.click(); await until(() => video.currentTime > time + .1);
  check(poster.hidden, 'resume hides the poster');
  button.click(); await wait(100); button.click(); await wait(2600);
  check(poster.hidden && !video.paused, 'early resume cancels the pending poster timer');
  check(!video.paused, 'resume continues from the paused position');
  const parent = card.parentElement; card.remove();
  check(video.paused && video.controls && button.hidden, 'disconnect stops media and restores native controls');
  parent.append(card); await wait(100); button.click(); await until(() => !video.paused && video.currentTime > time + .2);
  check(!video.controls && !button.hidden, 'reconnect creates one working control');
  button.click(); await wait(50);
  const script = document.createElement('script'); script.src = '../../../shared/academy/review-card.js?v=video-3';
  const loaded = new Promise(resolve => script.onload=resolve); document.body.append(script); await loaded;
  button.click(); await until(() => !video.paused && button.hasAttribute('data-playing'));
  check(button.hasAttribute('data-playing'), 'duplicate runtime does not double-toggle');
  video.currentTime = video.duration - .1; await until(() => video.ended); await wait(50);
  check(!button.hasAttribute('data-playing'), 'ended resets the play control');
  button.click(); await until(() => !video.paused && video.currentTime < 2);
  check(!video.ended, 'play after ending restarts the video');
  button.click(); await wait(50);
  video.src = 'data:video/mp4;base64,AAAA'; button.click(); await until(() => !card.querySelector('[role="status"]').hidden);
  check(video.paused && !button.hasAttribute('data-playing'), 'invalid media reports an error and resets control');
  video.src = ${JSON.stringify(item.video.src)}; video.load(); button.click(); await until(() => !video.paused && video.currentTime > .1);
  check(card.querySelector('[role="status"]').hidden, 'retry recovers after a failed source');
  const second = document.querySelectorAll('[data-review-video-card]')[0];
  const other = second === card ? document.querySelectorAll('[data-review-video-card]')[1] : second;
  other.querySelector('button').click(); await until(() => other.querySelector('video').currentTime > .1);
  check(video.paused && !button.hasAttribute('data-playing'), 'starting the other review pauses previous media');
  other.querySelector('button').click();
 } catch(error) { results.push('FAIL '+error.message); video.pause(); }
 output.textContent = results.join(' | ');
});
</script></body></html>`;
await fs.writeFile(new URL('video-fixture.html', import.meta.url), html);
