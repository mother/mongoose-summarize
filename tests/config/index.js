const mongoose = require('mongoose')
const mockgoose = require('mockgoose')

mongoose.Promise = global.Promise

require('./models')

module.exports = exports = {
   setup: (done) => {
      mockgoose(mongoose).then(() => {
         mongoose.connect('mongodb://127.0.0.1:27017/TestingDB', done)
      })
   },
   teardown: done => mongoose.unmock(done)
}
