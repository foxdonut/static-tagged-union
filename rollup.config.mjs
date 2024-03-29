import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const name = 'TaggedUnion';
const input = './src/index.js';
const outFileReg = 'dist/static-tagged-union.js';
const outFileMin = 'dist/static-tagged-union.min.js';
const extensions = ['.js'];
const babelHelpers = 'bundled';

const plugins = [
  resolve({ extensions }),
  commonjs(),
  babel({
    babelHelpers,
    extensions,
    include: ['src/**']
  })
];

const output = {
  name,
  format: 'umd'
};

export default [
  {
    input,
    plugins,
    output: Object.assign(
      {
        file: outFileReg
      },
      output
    )
  },
  {
    input,
    plugins: plugins.concat(terser()),
    output: Object.assign(
      {
        file: outFileMin
      },
      output
    )
  }
];
