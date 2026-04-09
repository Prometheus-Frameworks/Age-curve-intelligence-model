import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { build } from 'esbuild';

const outdir = join(process.cwd(), 'dist', 'ui');

await mkdir(outdir, { recursive: true });

const result = await build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  format: 'esm',
  splitting: false,
  sourcemap: false,
  minify: false,
  outdir,
  entryNames: 'assets/app',
  assetNames: 'assets/[name]',
  metafile: true,
  logLevel: 'info',
  loader: {
    '.css': 'css',
  },
});

const outputs = Object.keys(result.metafile.outputs);
const jsFile = outputs.find((path) => path.endsWith('.js'));
const cssFile = outputs.find((path) => path.endsWith('.css'));

if (!jsFile) {
  throw new Error('Client build failed: no JS output generated.');
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Age Curve Intelligence</title>
    ${cssFile ? `<link rel="stylesheet" href="/${cssFile.replace('dist/ui/', '')}" />` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/${jsFile.replace('dist/ui/', '')}"></script>
  </body>
</html>
`;

await writeFile(join(outdir, 'index.html'), html, 'utf8');
