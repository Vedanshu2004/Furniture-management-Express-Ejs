const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  address: {
    location: {
      type: String,
      required: true
    }
  },
  furnitures: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Furniture'
    }
  ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
