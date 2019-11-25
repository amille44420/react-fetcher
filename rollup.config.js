import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const env = process.env.NODE_ENV;

const config = {
  input: 'src/index.js',
  external: [...Object.keys(pkg.peerDependencies), 'react-dom'],
  output: {
    format: 'umd',
    name: 'ReactContextFetcher',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'prop-types': 'PropTypes',
    },
  },
  plugins: [
    nodeResolve(),
    babel({
      exclude: '**/node_modules/**',
      runtimeHelpers: true,
    }),
    commonjs({
      namedExports: {
        'node_modules/react-is/index.js': ['isValidElementType'],
      },
    }),
    env === 'production' &&
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
  ].filter(Boolean),
};

export default config;
