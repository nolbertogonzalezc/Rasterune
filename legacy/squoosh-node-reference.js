const { ImagePool } = require('@squoosh/lib');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'old');
const outputDir = path.join(__dirname, '..', 'new');

function isJPEG(buf) {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPNG(buf) {
  return (
    buf.length > 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

function isSupportedImage(buf) {
  return isJPEG(buf) || isPNG(buf);
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });

  const all = fs.readdirSync(inputDir).filter((file) => /\.(jpe?g|png)$/i.test(file));
  console.log(`Encontradas ${all.length} imagenes.`);

  const imagePool = new ImagePool();
  const failures = [];
  let okCount = 0;

  const tasks = all.map(async (file) => {
    const src = path.join(inputDir, file);
    let buf;

    try {
      buf = fs.readFileSync(src);
    } catch (error) {
      failures.push({ file, reason: `No se pudo leer: ${error.message}` });
      return;
    }

    if (!isSupportedImage(buf)) {
      failures.push({ file, reason: 'Formato no soportado o archivo danado (firma no PNG/JPEG)' });
      return;
    }

    try {
      const image = imagePool.ingestImage(buf);

      if (isPNG(buf)) {
        await image.encode({ webp: { quality: 100, effort: 6 } });
        const { binary } = await image.encodedWith.webp;
        const out = path.join(outputDir, `${path.parse(file).name}.webp`);
        fs.writeFileSync(out, binary);
        console.log(`OK ${file} -> ${path.basename(out)}`);
      } else if (isJPEG(buf)) {
        await image.encode({ avif: { cqLevel: 10, effort: 6 } });
        const { binary } = await image.encodedWith.avif;
        const out = path.join(outputDir, `${path.parse(file).name}.avif`);
        fs.writeFileSync(out, binary);
        console.log(`OK ${file} -> ${path.basename(out)}`);
      }

      okCount += 1;
    } catch (error) {
      failures.push({ file, reason: error?.message || String(error) });
    }
  });

  await Promise.allSettled(tasks);
  await imagePool.close();

  console.log('\n===== RESUMEN =====');
  console.log(`Convertidas OK: ${okCount}`);
  console.log(`Fallidas: ${failures.length}`);

  for (const { file, reason } of failures.slice(0, 20)) {
    console.log(`- ${file}: ${reason}`);
  }
})();
