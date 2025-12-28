
import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { rollupPluginHTML as html } from '@web/rollup-plugin-html';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import glob from 'glob';
import { readFileSync } from 'fs';

const extensions = [".ts", ".js", ".html"];

// Plugin to inject Buffer polyfill for Google Apps Script
const injectBufferPolyfill = () => {
  const polyfillCode = readFileSync('./src/buffer-polyfill.js', 'utf-8')
    .replace('export const Buffer = BufferPolyfill;', 'const Buffer = BufferPolyfill;');

  return {
    name: 'inject-buffer-polyfill',
    renderChunk(code) {
      // Inject the polyfill at the beginning if Buffer is referenced
      if (code.includes('Buffer.') || code.includes('Buffer(')) {
        return polyfillCode + '\n' + code;
      }
      return code;
    }
  };
};

const preventTreeShakingPlugin = () => {
    return {
      name: 'no-treeshaking',
      resolveId(id, importer) {
        if (!importer) {
            // let's not treeshake entry points, as we're not exporting anything in App Scripts
          return {id, moduleSideEffects: "no-treeshake" }
        }
        return null;
      }
    }
  }

  function inlineBundles(html, { bundle }) {
    for (const filename of Object.keys(bundle.bundle)) {
        const entry = bundle.bundle[filename];
        if (entry.type === 'chunk') {
            html = replaceScript(html, filename, entry.code);
            delete bundle.bundle[filename]
        } else if (entry.type === 'asset') {
            html = replaceAsset(html, filename, entry.source.toString())
            delete bundle.bundle[filename]
        }
    }
    return html;
}

function replaceScript(html, filename, code) {
    const reScript = new RegExp(`<script([^>]*?) src="[./]*${filename}"([^>]*)></script>`);
    return html.replace(reScript, (_, beforeSrc, afterSrc) => `<script${beforeSrc}${afterSrc}>\n${code}\n</script>`);
}

function createHtmlBundleConfig(files) {
    const paths = glob.sync(files);
    return paths.map(path => (
        {
            input: path,
            output: {
                dir: 'dist',
            },
            plugins: [
                nodeResolve(),
                //commonjs(),
                typescript(),
                html({transformHtml: inlineBundles}),
            ],
        }
    ));
}

export default [
  // Process HTML files but exclude template files (they contain scriptlets that shouldn't be transformed)
  ...createHtmlBundleConfig('src/gsheets/*.html').filter(config => !config.input.includes('-template.html')),
  {
  //input: ["./src/index.ts", "./src/bundle.js"],
  input: ["./src/gsheets/index.ts"],
  output: {
    dir: "dist",
    format: "esm",
  },
  plugins: [
    preventTreeShakingPlugin(),
    nodeResolve({
      extensions,
      mainFields: ['jsnext:main', 'main']
    }),
    babel({ extensions, babelHelpers: "runtime" }),
    commonjs(),
    typescript(),
    injectBufferPolyfill(),
  ],
}];