const express = require('express');
const router = express.Router();
const Furniture = require('../models/furniture');
const { isLoggedIn, isOwner } = require('../middleware');
const multer = require('multer');
const path = require('path');
const User = require('../models/user');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

// Index route - show all furniture
router.get('/', async (req, res) => {
  try {
    const furnitures = await Furniture.find({}).populate('owner');
    res.render('furniture/index', { furnitures });
  } catch (err) {
    req.flash('error', 'Something went wrong!');
    res.redirect('/');
  }
});

// New route - show form to create new furniture
router.get('/new', isLoggedIn, (req, res) => {
  res.render('furniture/new');
});

// Create route - create new furniture
router.post('/', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    const furniture = new Furniture(req.body);
    furniture.image = req.file.path;
    furniture.owner = req.user._id;
    await furniture.save();

    // Add furniture to user's furniture list
    const user = await User.findById(req.user._id);
    user.furnitures.push(furniture);
    await user.save();

    req.flash('success', 'Successfully created new furniture!');
    res.redirect(`/furniture/${furniture._id}`);
  } catch (err) {
    console.log(err);
    req.flash('error', 'Failed to create furniture');
    res.redirect('/furniture/new');
  }
});

// Show route - show one furniture
router.get('/:id', async (req, res) => {
  try {
    const furniture = await Furniture.findById(req.params.id).populate('owner');
    if (!furniture) {
      req.flash('error', 'Furniture not found!');
      return res.redirect('/furniture');
    }
    res.render('furniture/show', { furniture });
  } catch (err) {
    req.flash('error', 'Something went wrong!');
    res.redirect('/furniture');
  }
});

// Edit route - show form to edit furniture
router.get('/:id/edit', isLoggedIn, async (req, res) => {
  try {
    const furniture = await Furniture.findById(req.params.id);
    if (!furniture) {
      req.flash('error', 'Furniture not found!');
      return res.redirect('/furniture');
    }

    // Check if user is the owner
    if (!furniture.owner.equals(req.user._id)) {
      req.flash('error', 'You do not have permission to do that!');
      return res.redirect(`/furniture/${req.params.id}`);
    }

    res.render('furniture/edit', { furniture });
  } catch (err) {
    req.flash('error', 'Something went wrong!');
    res.redirect('/furniture');
  }
});

// Update route - update furniture
router.put('/:id', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const furniture = await Furniture.findById(id);

    // Check if user is the owner
    if (!furniture.owner.equals(req.user._id)) {
      req.flash('error', 'You do not have permission to do that!');
      return res.redirect(`/furniture/${id}`);
    }

    // Cannot change furnitureName as per requirement
    delete req.body.furnitureName;

    const updatedFurniture = await Furniture.findByIdAndUpdate(id, req.body, { new: true });

    // Update image if a new one is uploaded
    if (req.file) {
      updatedFurniture.image = req.file.path;
      await updatedFurniture.save();
    }

    req.flash('success', 'Successfully updated furniture!');
    res.redirect(`/furniture/${id}`);
  } catch (err) {
    req.flash('error', 'Failed to update furniture');
    res.redirect(`/furniture/${req.params.id}/edit`);
  }
});

// Delete route - delete furniture
router.delete('/:id', isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const furniture = await Furniture.findById(id);

    // Check if user is the owner
    if (!furniture.owner.equals(req.user._id)) {
      req.flash('error', 'You do not have permission to do that!');
      return res.redirect(`/furniture/${id}`);
    }

    await Furniture.findByIdAndDelete(id);

    // Remove furniture from user's furniture list
    await User.findByIdAndUpdate(req.user._id, { $pull: { furnitures: id } });

    req.flash('success', 'Successfully deleted furniture!');
    res.redirect('/furniture');
  } catch (err) {
    req.flash('error', 'Failed to delete furniture');
    res.redirect('/furniture');
  }
});

module.exports = router;
