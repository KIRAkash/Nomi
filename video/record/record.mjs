// node record/record.mjs <clip> [--app http://localhost:8081]
// Records one clip of the web app in Chrome at a device size, the way the video shows it: real camera mode with a generated
// feed as the webcam (record/feeds.py), touch taps, live model calls. Frames come from the DevTools screencast at full pixel
// density and are rebuilt at a constant 30 fps. Writes clips/<clip>.mp4 and clips/<clip>.taps.json (time and place of
// every tap, in device pixels, for the fingertip ripples Remotion draws).
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { chromium } from 'playwright';

const HERE = new URL('.', import.meta.url).pathname;
const args = process.argv.slice(2);
const name = args[0];
const APP = args.includes('--app') ? args[args.indexOf('--app') + 1] : 'http://localhost:8081';

const DEVICES = {
  phone: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true },
  tablet: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, isMobile: false },
};

const BIRYANI = '00000000-0000-0000-0000-0000000d0001';

// Each clip: the device, the camera feed (if any), the role signed in, the page it opens on, and the steps. Steps get a
// small kit: tap() presses like a finger and logs it, feedTime() is where the camera feed is, hold() pauses on screen.
const CLIPS = {
  menu: {
    device: 'tablet',
    feed: 'menu',
    role: 'owner',
    url: '/setup',
    // Off camera: step 1 is already filled in; the clip opens on the menu camera.
    async prep({ page }) {
      await page.getByRole('button', { name: 'Next: your menu' }).click();
      await page.getByRole('button', { name: 'Photograph the menu' }).waitFor();
    },
    async run({ page, tap, hold, feed }) {
      await page.waitForFunction((t) => document.querySelector('video')?.currentTime >= t, feed.steady[0].from + 0.8, { timeout: 60_000 });
      await tap(page.getByRole('button', { name: 'Photograph the menu' }));
      const parts = page.getByRole('button', { name: "Next: what's on each plate" });
      await parts.waitFor({ timeout: 120_000 });
      await hold(2.2);
      await tap(parts);
      await page.getByText('Listing the parts SAM 3.1 will look for').first().waitFor({ timeout: 10_000 }).catch(() => {});
      await page.waitForFunction(() => !document.body.innerText.includes('Listing the parts SAM 3.1 will look for'), null, { timeout: 120_000 });
      await hold(3);
    },
  },
  rules: {
    device: 'tablet',
    feed: 'golden',
    audio: 'rules',
    role: 'head_chef',
    url: `/golden/${BIRYANI}`,
    // Off camera: the three photos and SAM's masks, so the clip opens on "Say how it should look".
    async prep({ page, feed }) {
      await goldenPhotos(page, feed, (l) => l.click());
      await page.getByRole('button', { name: 'Next: find the parts' }).click();
      const next = page.getByRole('button', { name: 'Next: speak the rules' });
      await next.waitFor({ timeout: 120_000 });
      await next.click();
      await page.getByRole('button', { name: /Hold to talk/ }).waitFor();
    },
    async run({ page, press, tap, hold }) {
      await hold(0.6);
      await press(page.getByRole('button', { name: /Hold to talk/ }), 11.4);
      const keep = page.getByRole('button', { name: /^Keep \d+ rules?$/ });
      await keep.waitFor({ timeout: 90_000 });
      await hold(2.5);
      await tap(keep);
      await page.getByRole('button', { name: 'Draw again' }).first().waitFor({ timeout: 150_000 });
      await hold(3);
    },
  },
  pass: {
    device: 'tablet',
    feed: 'pass',
    role: 'head_chef',
    url: '/pass',
    async run({ page, tap, hold }) {
      await page.waitForFunction(() => document.querySelector('video')?.currentTime >= 3.2, null, { timeout: 60_000 });
      await tap(page.getByRole('button', { name: 'Chicken Biryani' }).first());
      await hold(0.8);
      await tap(page.getByRole('button', { name: 'Check this plate' }));
      await page.getByRole('button', { name: /Send as is|Next plate/ }).first().waitFor({ timeout: 120_000 });
      await hold(4);
    },
  },
  guest: {
    device: 'phone',
    feed: 'guest',
    audio: 'guest',
    role: 'head_chef',
    url: '/t/demo-table-7',
    async run({ page, tap, press, hold }) {
      await page.getByRole('button', { name: 'Show us your plate' }).waitFor();
      await hold(1.2);
      await tap(page.getByRole('button', { name: 'Show us your plate' }));
      const shutter = page.getByRole('button', { name: 'Take the photo of your plate' });
      await shutter.waitFor();
      await page.waitForFunction(() => document.querySelector('video')?.currentTime >= 2.4, null, { timeout: 60_000 });
      await tap(shutter);
      const yes = page.getByRole('button', { name: "That's it" });
      await yes.waitFor({ timeout: 90_000 });
      await hold(1.8);
      await tap(yes);
      await page.getByRole('button', { name: 'Good' }).first().waitFor();
      await hold(1);
      await tap(page.getByRole('button', { name: 'Good' }).first());
      await hold(1);
      await tap(page.getByRole('button', { name: 'Add a voice note or photo' }));
      await page.getByRole('button', { name: /Hold to talk/ }).waitFor();
      await hold(1);
      await press(page.getByRole('button', { name: /Hold to talk/ }), 5.4);
      const send = page.getByRole('button', { name: 'Send' });
      await page.getByRole('button', { name: /^Remove / }).first().waitFor({ timeout: 90_000 });
      await hold(2.8);
      await tap(page.getByRole('button', { name: /^Remove / }).last());
      await hold(1.4);
      await tap(send);
      await page.getByText('Thank you!').waitFor({ timeout: 30_000 });
      await hold(2.5);
    },
  },
  manager: {
    device: 'phone',
    role: 'manager',
    url: '/feedback',
    async run({ page, tap, hold }) {
      const note = page.getByRole('button', { name: /^Table 7,/ }).first();
      await note.waitFor();
      await hold(1.5);
      await tap(note);
      const approve = page.getByRole('button', { name: 'Approve and send' });
      await approve.waitFor({ timeout: 90_000 });
      await page.waitForFunction(() => !document.body.innerText.includes('Muse Spark is writing'), null, { timeout: 90_000 });
      await hold(2.5);
      await tap(approve);
      await page.getByText(/Sent, approved by/).waitFor({ timeout: 20_000 });
      await hold(2.5);
    },
  },
  briefing: {
    device: 'tablet',
    role: 'owner',
    url: '/today',
    async run({ page, tap, hold }) {
      const run = page.getByRole('button', { name: 'Run Nightshift now' });
      await run.waitFor();
      await hold(1.5);
      await tap(run);
      await page.getByRole('button', { name: 'Run again' }).waitFor({ timeout: 150_000 });
      await hold(4);
    },
  },
  watch: {
    device: 'tablet',
    role: 'head_chef',
    url: '/kitchen',
    async run({ page, tap, hold }) {
      const build = page.getByRole('button', { name: 'Build from last night' });
      await build.waitFor();
      await hold(1.2);
      await tap(build);
      await page.getByRole('button', { name: 'Count again' }).waitFor({ timeout: 150_000 });
      await hold(4);
    },
  },
  ask: {
    device: 'phone',
    role: 'owner',
    url: '/ask',
    async run({ page, tap, hold }) {
      const field = page.getByRole('textbox', { name: 'Your question' });
      await field.waitFor();
      await hold(1);
      await tap(field);
      await page.keyboard.type('How much biryani will we sell on Saturday?', { delay: 45 });
      await hold(0.6);
      await tap(page.getByRole('button', { name: 'Ask', exact: true }));
      await page.getByText('Reading notes, plates and counts').waitFor({ timeout: 10_000 }).catch(() => {});
      await page.waitForFunction(() => !document.body.innerText.includes('Reading notes, plates and counts'), null, { timeout: 120_000 });
      await hold(4.5);
    },
  },
  larder: {
    device: 'phone',
    feed: 'larder',
    role: 'manager',
    url: '/larder',
    async run({ page, tap, hold }) {
      const open = page.getByRole('button', { name: 'Photograph the shelves' });
      await open.waitFor();
      await hold(1);
      await tap(open);
      const take = page.getByRole('button', { name: 'Take it' });
      await take.waitFor();
      await page.waitForFunction(() => document.querySelector('video')?.currentTime >= 2.2, null, { timeout: 60_000 });
      await tap(take);
      const count = page.getByRole('button', { name: /^Count from/ });
      await count.waitFor();
      await hold(0.8);
      await tap(count);
      await page.getByRole('button', { name: 'Counting…' }).waitFor({ timeout: 10_000 }).catch(() => {});
      await page.getByRole('button', { name: 'Counting…' }).waitFor({ state: 'detached', timeout: 120_000 });
      await hold(3);
      // Down to the draft order the count just put oil on.
      await page.getByText('Reorder list · draft').first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      await hold(4.5);
    },
  },
  handover: {
    device: 'phone',
    audio: 'handover',
    role: 'staff',
    url: '/handover',
    async run({ page, press, hold }) {
      const talk = page.getByRole('button', { name: /Hold to hand over/ });
      await talk.waitFor();
      await hold(1);
      await press(talk, 13.8);
      await page.getByText(/Writing it down, then sorting/).waitFor({ timeout: 10_000 }).catch(() => {});
      await page.waitForFunction(() => !/Writing it down, then sorting/.test(document.body.innerText), null, { timeout: 120_000 });
      await hold(1.5);
      await page.getByText('Just now').first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      await hold(5);
    },
  },
  models: {
    device: 'phone',
    audio: 'handover',
    role: 'owner',
    url: '/models',
    // Off camera: real calls from two screens reached from this one, so the log has something live in it.
    async prep({ page }) {
      await page.getByRole('button', { name: /Try: Ask Nomi/ }).click();
      const field = page.getByRole('textbox', { name: 'Your question' });
      await field.waitFor();
      await field.fill('Which dish do guests love most this week?');
      await page.getByRole('button', { name: 'Ask', exact: true }).click();
      await page.getByText('Reading notes, plates and counts').waitFor({ timeout: 10_000 }).catch(() => {});
      await page.waitForFunction(() => !document.body.innerText.includes('Reading notes, plates and counts'), null, { timeout: 120_000 });
      await page.goBack();
      await page.getByRole('button', { name: /Try: Handover/ }).click();
      const talk = page.getByRole('button', { name: /Hold to hand over/ });
      await talk.waitFor();
      const box = await talk.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(13800);
      await page.mouse.up();
      await page.getByText(/Writing it down, then sorting/).waitFor({ timeout: 10_000 }).catch(() => {});
      await page.waitForFunction(() => !/Writing it down, then sorting/.test(document.body.innerText), null, { timeout: 120_000 });
      await page.goBack();
      await page.getByText(/model calls?$/).first().waitFor();
    },
    async run({ page, hold }) {
      await hold(2);
      await page.getByText('Live calls', { exact: true }).evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      await hold(5);
    },
  },
  cards: {
    device: 'phone',
    role: 'staff',
    url: '/cards',
    async run({ page, tap, hold }) {
      const kn = page.getByRole('radio', { name: 'Kannada' });
      await kn.waitFor();
      await hold(2);
      await tap(kn);
      await hold(1.2);
      // Down to the plating card, where the translated steps appear.
      await page.getByText(/plating cards/i).first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      await page.waitForTimeout(1500);
      await page.waitForFunction(() => !/Translating|Muse Spark is/.test(document.body.innerText), null, { timeout: 90_000 });
      await hold(4);
    },
  },
  golden: {
    device: 'tablet',
    feed: 'golden',
    role: 'head_chef',
    url: `/golden/${BIRYANI}`,
    async run({ page, tap, feedTime, hold, feed }) {
      await page.getByRole('button', { name: 'Take photo 1' }).waitFor();
      await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
      for (const [k, window] of feed.steady.slice(0, 3).entries()) {
        // Tap once the camera has settled on this take and the shutter is live again.
        const shutter = page.getByRole('button', { name: `Take photo ${k + 1}` });
        await shutter.waitFor();
        await page.waitForFunction((t) => document.querySelector('video')?.currentTime >= t, window.from + 0.7, { timeout: 60_000 });
        const at = await feedTime();
        if (at > window.to - 0.3) throw new Error(`take ${k + 1}: the feed passed its steady window (${at.toFixed(1)}s)`);
        await tap(shutter);
      }
      const nextStep = page.getByRole('button', { name: 'Next: find the parts' });
      await nextStep.waitFor({ timeout: 30_000 });
      await hold(1.4);
      await tap(nextStep);
      // SAM 3.1 runs on the three photos; wait for its answer (all parts agreed, or one to check).
      await page.getByRole('button', { name: /Next: speak the rules|Check this/ }).first().waitFor({ timeout: 120_000 });
      await hold(3);
    },
  },
};

/** The Golden Plate's three photos: each shutter press once the feed has settled on that take. */
async function goldenPhotos(page, feed, press) {
  await page.getByRole('button', { name: 'Take photo 1' }).waitFor();
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
  for (const [k, w] of feed.steady.slice(0, 3).entries()) {
    const shutter = page.getByRole('button', { name: `Take photo ${k + 1}` });
    await shutter.waitFor();
    await page.waitForFunction((t) => document.querySelector('video')?.currentTime >= t, w.from + 0.7, { timeout: 60_000 });
    await press(shutter);
  }
}

const clip = CLIPS[name];
if (!clip) throw new Error(`unknown clip "${name}"; one of: ${Object.keys(CLIPS).join(', ')}`);
const device = DEVICES[clip.device];
const feed = clip.feed ? JSON.parse(readFileSync(join(HERE, 'out', `${clip.feed}.json`), 'utf8')) : null;

const flags = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--hide-scrollbars'];
if (clip.feed) flags.push(`--use-file-for-fake-video-capture=${join(HERE, 'out', `${clip.feed}.mjpeg`)}`);
if (clip.audio) flags.push(`--use-file-for-fake-audio-capture=${join(HERE, 'audio', `${clip.audio}.wav`)}%noloop`);
// The window must be the device's size: the screencast captures the window, not the emulated viewport.
flags.push(`--window-size=${device.viewport.width},${device.viewport.height}`);
const browser = await chromium.launch({ channel: 'chrome', args: flags });
const context = await browser.newContext({ ...device, hasTouch: true, permissions: ['camera', 'microphone'] });
await context.addInitScript(({ role }) => {
  localStorage.setItem('nomi.role', role);
  localStorage.setItem('nomi.democam', '0');
  localStorage.setItem('nomi.recording', '1');
  // A tablet's rear camera reports facingMode "environment"; the fake camera reports nothing, which expo-camera takes as a
  // selfie camera and mirrors. Report what the real rear camera would.
  const settings = MediaStreamTrack.prototype.getSettings;
  MediaStreamTrack.prototype.getSettings = function () {
    const s = settings.call(this);
    return this.kind === 'video' ? { ...s, facingMode: 'environment' } : s;
  };
}, { role: clip.role });

const page = await context.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('  page error:', m.text().slice(0, 160)));
await page.goto(APP + clip.url);
if (clip.prep) await clip.prep({ page, feed });

// ---------- screencast ----------
const frames = join(HERE, 'clips', `${name}.frames`);
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
const shots = [];
const cdp = await context.newCDPSession(page);
// Ack first and write in the background: Chrome waits for the ack before the next frame, so a slow write halves the rate.
const writes = [];
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  const file = join(frames, `${String(shots.length).padStart(5, '0')}.jpg`);
  shots.push({ file, t: metadata.timestamp });
  writes.push(writeFile(file, Buffer.from(data, 'base64')));
});
// Whole, even pixel sizes: Chrome wants integers, and the H.264 encoder wants even sides.
const even = (n) => 2 * Math.round(n / 2);
const px = { width: even(device.viewport.width * device.deviceScaleFactor), height: even(device.viewport.height * device.deviceScaleFactor) };
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: px.width, maxHeight: px.height, everyNthFrame: 1 });
const start = Date.now() / 1000;

// ---------- the kit ----------
const taps = [];
// Like a thumb would: if the target is off screen, scroll it smoothly into view first.
const reach = async (locator) => {
  const box = await locator.boundingBox();
  if (box && box.y >= 0 && box.y + box.height <= device.viewport.height) return;
  await locator.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  await page.waitForTimeout(900);
};
const tap = async (locator) => {
  await reach(locator);
  const box = await locator.boundingBox();
  if (!box) throw new Error('tap: element not on screen');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.waitForTimeout(250); // a finger arrives a moment after the eye finds the button
  taps.push({ t: +(Date.now() / 1000 - start).toFixed(3), x: Math.round(x * device.deviceScaleFactor), y: Math.round(y * device.deviceScaleFactor) });
  await page.touchscreen.tap(x, y);
};
// Press and hold like a finger (hold-to-talk): a touch that stays down for `seconds`.
const touch = await context.newCDPSession(page);
const press = async (locator, seconds) => {
  await reach(locator);
  const box = await locator.boundingBox();
  if (!box) throw new Error('press: element not on screen');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.waitForTimeout(250);
  taps.push({ t: +(Date.now() / 1000 - start).toFixed(3), x: Math.round(x * device.deviceScaleFactor), y: Math.round(y * device.deviceScaleFactor), hold: seconds });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await page.waitForTimeout(seconds * 1000);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const feedTime = () => page.evaluate(() => document.querySelector('video')?.currentTime ?? 0);
const hold = (s) => page.waitForTimeout(s * 1000);

// A step that times out still keeps everything recorded up to it, so a slow model call doesn't lose the take.
let failed = null;
try {
  await hold(0.8);
  await clip.run({ page, tap, press, feedTime, hold, feed });
} catch (err) {
  failed = err;
} finally {
  await cdp.send('Page.stopScreencast').catch(() => {});
  await browser.close();
}

// ---------- constant 30 fps ----------
// The screencast sends a frame only when the screen changes; each frame lasts until the next one.
const end = Date.now() / 1000;
await Promise.all(writes);
// Output frame k shows the newest screencast frame at or before k/30 s. (ffmpeg's concat input can't do this: it gives
// every image at least 1/25 s, which stretched 30 fps frames.)
const out = join(HERE, 'clips', `${name}.mp4`);
const enc = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
  '-vf', `scale=${px.width}:${px.height}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((ok, fail) => enc.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)))));
for (let k = 0, j = 0; shots[0].t + k / 30 <= end; k++) {
  while (j + 1 < shots.length && shots[j + 1].t <= shots[0].t + k / 30) j++;
  if (!enc.stdin.write(readFileSync(shots[j].file))) await new Promise((ok) => enc.stdin.once('drain', ok));
}
enc.stdin.end();
await done;
// Tap times are from the recorder's start; shift them to the first frame's time.
const offset = shots[0].t - start;
writeFileSync(join(HERE, 'clips', `${name}.taps.json`), JSON.stringify({ size: [px.width, px.height], taps: taps.map((t) => ({ ...t, t: +(t.t - offset).toFixed(3) })) }, null, 2));
rmSync(frames, { recursive: true, force: true });
console.log(`${failed ? '✗' : '✓'} ${name}: ${(end - shots[0].t).toFixed(1)}s, ${shots.length} frames, ${taps.length} taps → clips/${name}.mp4${failed ? `\n  stopped early: ${failed.message.split('\n')[0]}` : ''}`);
