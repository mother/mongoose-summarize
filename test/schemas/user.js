const mongoose = require('mongoose')
const summarize = require('../../')
const Schema = mongoose.Schema

const UserSchema = new Schema({
   email: { type: String, required: true },
   phone: { type: String },
   name: {
      first: { type: String, required: true },
      last: { type: String, required: true }
   },
   avatar: {
      file: { type: Schema.Types.ObjectId, ref: 'file' },
      url: { type: String } // generated
   },
   password: {
      encrypted_password: { type: String },
      reset_request: {
         code: { type: String, trim: true },
         date: { type: Date },
         expires: { type: Date }
      }
   }
})

UserSchema.plugin(summarize.defineSummarySource)

module.exports = exports = UserSchema
