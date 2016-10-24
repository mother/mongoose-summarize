const mongoose = require('mongoose')
const summarize = require('../../')
const UserSummarySchema = require('./user.summary')

const Schema = mongoose.Schema

const CommentSchema = new Schema({
   author: UserSummarySchema,
   body: { type: String },
   added: {
      date: { type: Date, default: Date.now }
   }
})

CommentSchema.plugin(summarize, { field: 'author', ref: 'user' })

module.exports = exports = CommentSchema
