const mongoose = require('mongoose')
const UserSummarySchema = require('./user.summary')

const Schema = mongoose.Schema

const CommentSchema = new Schema({
   author: UserSummarySchema,
   body: { type: String },
   added: {
      date: { type: Date, default: Date.now }
   }
})

module.exports = exports = CommentSchema
