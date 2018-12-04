module.exports = function(ctx) {
  return {
    plugins: {
      autoprefixer: {},
      cssnano:
        ctx.env === 'production' ? {zindex: false, discardUnused: false} : false
    }
  };
};
