// rollup.config.js
import babel from 'rollup-plugin-babel'
import typescript from 'rollup-plugin-typescript'

export default {
  input: 'lib/index.ts',
  output: {
    file: 'index.js',
    format: 'umd',
    name: 'ImgViewer'
  },
  plugins: [
    typescript({
      typescript: require('typescript')
    }),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
      externalHelpers: false,
      runtimeHelpers: true
    })
  ]
}