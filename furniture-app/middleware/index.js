module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'You must be signed in first!');
    return res.redirect('/login');
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const furniture = await Furniture.findById(id);
  if (!furniture.owner.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/furniture/${id}`);
  }
  next();
};
