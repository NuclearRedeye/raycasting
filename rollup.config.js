import { default as copy } from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'out/debug/index.js',
    output: [
      {
        file: 'out/release/index.js',
        plugins: [terser()]
      }
    ],
    plugins: [
      copy({
        targets: [
          { src: 'src/html/*', dest: ['out/debug', 'out/release'] },
          { src: 'src/css/*',  dest: ['out/debug', 'out/release'] },
          { src: 'src/assets', dest: ['out/debug', 'out/release'] }
        ]
      })
    ]
  }
];
