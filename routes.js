
var experiments = ['skull', 'monster', 'analogy'];

module.exports = {
  home: (ctx) => {
    ctx.render('home');
  },
  experiments: (ctx) => {
    ctx.render('experiments');
  },
  experiment: (ctx) => {
    if (experiments.indexOf(ctx.params.experiment) > -1) {
      ctx.render(ctx.params.experiment);
    } else {
      ctx.json = { error: 'error' };
    }
  }
};