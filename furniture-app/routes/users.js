const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');

// Register routes
router.get('/register', (req, res) => {
  res.render('users/register');
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, phoneNumber, age, location } = req.body;
    const user = new User({
      username,
      phoneNumber,
      age,
      address: { location }
    });
    
    const registeredUser = await User.register(user, password);
    
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash('success', 'Welcome to Furniture App!');
      res.redirect('/furniture');
    });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/register');
  }
});

// Login routes
router.get('/login', (req, res) => {
  res.render('users/login');
});

router.post('/login', passport.authenticate('local', {
  failureFlash: true,
  failureRedirect: '/login'
}), (req, res) => {
  req.flash('success', 'Welcome back!');
  const redirectUrl = req.session.returnTo || '/furniture';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success', 'Goodbye!');
    res.redirect('/furniture');
  });
});

module.exports = router;
