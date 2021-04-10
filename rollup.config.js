import { default as copy } from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'dist/debug/index.js',
    output: [
      {
        file: 'dist/release/index.js',
        plugins: [terser()]
      }
    ],
    plugins: [
      copy({
        targets: [
          { src: 'src/html/*', dest: ['dist/debug', 'dist/release'] },
          { src: 'src/css/*',  dest: ['dist/debug', 'dist/release'] },
          { src: 'src/assets', dest: ['dist/debug', 'dist/release'] }
        ]
      })
    ]
  }
];
