const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSummarySchema = new Schema({
   _id: { type: Schema.Types.ObjectId, required: true },
   name: {
      first: { type: String, trim: true },
      last: { type: String, trim: true }
   },
   avatar: {
      url: { type : String }
   }
})

module.exports = exports = UserSummarySchema
