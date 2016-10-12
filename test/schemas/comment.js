const mongoose = require('mongoose')
const summarize = require('../../')
const UserSchema = require('./user')
const UserSummarySchema = require('./user.summary')

const Schema = mongoose.Schema

const CommentSchema = new Schema({
   author: UserSummarySchema,
   body: { type: String },
   added: {
      date: { type: Date, default: Date.now }
   }
})

const User = mongoose.model('user', UserSchema)
CommentSchema.plugin(summarize, { field: 'author', ref_model: User })

module.exports = exports = CommentSchema
