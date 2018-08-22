// rollup.config.js
import babel from 'rollup-plugin-babel'
import typescript from 'rollup-plugin-typescript'

export default {
  input: 'lib/index.ts',
  format: 'umd',
  moduleName: 'imgViewer',
  output: {
    file: 'index.js'
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