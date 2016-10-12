const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const mockgoose = require('mockgoose')

module.exports = exports = (done) => {
   mockgoose(mongoose).then(() => {
      mongoose.connect('mongodb://127.0.0.1:27017/TestingDB', (err) => {
         done(err)
      })
   })
}

