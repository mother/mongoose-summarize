const mongoose = require('mongoose')
const mockgoose = require('mockgoose')

// TODO: Did not work with callback, find a way for that!!!
mockgoose(mongoose).then(() => {
   module.exports = exports = mongoose
   mongoose.connect('mongodb://localhost:27017')
   mongoose.connection.on('connected', () => {
      console.log('Mongoose Test Connected') // eslint-disable-line no-console
   })
})

