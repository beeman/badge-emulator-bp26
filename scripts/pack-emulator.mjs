import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const runtime = process.argv[2]
if (!runtime) {
  console.error('Usage: node scripts/pack-emulator.mjs <directory containing solana-os.js and solana-os.wasm>')
  process.exit(1)
}

const template = new URL('../src/emulator/index.html', import.meta.url)
const stylesheet = new URL('../src/emulator/badge.css', import.meta.url)
const storageScript = new URL('../src/emulator/sd-card.js', import.meta.url)
const destination = new URL('../src/emulator/firmware.generated.js', import.meta.url)

const [page, css, storage, script, wasm] = await Promise.all([
  readFile(template, 'utf8'),
  readFile(stylesheet, 'utf8'),
  readFile(storageScript, 'utf8'),
  readFile(join(runtime, 'solana-os.js'), 'utf8'),
  readFile(join(runtime, 'solana-os.wasm')),
])

const html = page
  .replace('<!-- BADGE STYLE -->', () => `<style>${css}</style>`)
  .replace('<!-- SD STORAGE -->', () => `<script>${storage}</script>`)
  .replace('<!-- FIRMWARE -->', () => `<script>${script.replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace(
    '<!-- WASM -->',
    () => `<script id="firmware-wasm" type="application/octet-stream">${wasm.toString('base64')}</script>`,
  )

await writeFile(destination, `export default ${JSON.stringify(html)}\n`)
