const dir = '../schemas'
const mongoose = require('mongoose')

mongoose.model('user', require(`${dir}/user`)).listenForUpdates()
mongoose.model('comment', require(`${dir}/comment`)).listenForSourceChanges()
