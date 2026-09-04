// Renderiza o HTML animado quadro a quadro (Chromium) e envia os frames ao ffmpeg via pipe.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const [S, FF, out, fpsArg, durArg] = process.argv.slice(2);
  const fps = Number(fpsArg || 30), dur = Number(durArg || 106.5), total = Math.round(fps * dur);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('file://' + S + '/videl-apresentacao.html');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  const cdp = await page.context().newCDPSession(page);
  const ff = spawn(FF, ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', S + '/audio.wav', '-i', S + '/legendas.srt',
    '-map', '0:v', '-map', '1:a', '-map', '2:s',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '160k', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=por',
    '-metadata', 'title=Videl T&L — Apresentação institucional + Tecnologia',
    '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const ms = (i / fps) * 1000;
    await page.evaluate(ms => document.getAnimations().forEach(a => { a.currentTime = ms; }), ms);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, fromSurface: true });
    const buf = Buffer.from(data, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
  await browser.close();
  console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
})().catch(e => { console.error(e); process.exit(1); });
