// user authentication check
function authCheck(ctx, next) {
  if (ctx.isAuthenticated()) {
    return next();
  } else {
    ctx.redirect('/login');
  }
}

module.exports = {
  authCheck: authCheck
};