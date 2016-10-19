const mongoose = require('mongoose')
const mockgoose = require('mockgoose')

require('./models')

mongoose.Promise = global.Promise

module.exports = exports = {
   setup: (done) => {
      mockgoose(mongoose).then(() => {
         mongoose.connect('mongodb://127.0.0.1:27017/TestingDB', (err) => {
            done(err)
         })
      })
   },
   teardown: done => mongoose.unmock(done)
}

