const dir = '../schemas'
const mongoose = require('mongoose')
const summarize = require('../../')

const User = mongoose.model('user', require(`${dir}/user`))

const CommentSchema = require(`${dir}/comment`)
CommentSchema.plugin(summarize, { field: 'author', ref_model: User })
mongoose.model('comment', CommentSchema).listenForSourceChanges()
