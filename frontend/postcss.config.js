export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // CSS optimization for production builds
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true
          },
          // Optimize for modern browsers
          autoprefixer: false,
          // Reduce calc() expressions
          reduceCalcFunction: true,
          // Remove duplicate rules
          discardDuplicates: true,
          // Merge longhand properties
          mergeRules: true,
          // Convert values to shorter forms
          normalizeWhitespace: true,
          // Optimize SVG
          svgo: true
        }]
      }
    })
  }
}