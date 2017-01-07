
var experiments = ['skull', 'monster', 'analogy', 'anyface', 'shakespeare'];

module.exports = {
  home: (ctx) => {
    ctx.render('home');
  },
  experiments: (ctx) => {
    ctx.render('experiments');
  },
  experiment: (ctx) => {
    if (experiments.indexOf(ctx.params.experiment) > -1) {
      ctx.render(ctx.params.experiment, {
        csrfToken: ctx.csrf
      });
    } else {
      ctx.json = { error: 'error' };
    }
  }
};