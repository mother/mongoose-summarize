const mongoose = require('mongoose')
const map = {}

// TODO: Check schema strictness
// TODO: Check if relevant fields were actually modified
// TODO: Autoindex dependencies
// TODO: Remove options
// TODO: Enforce _id: { type : Schema.Types.ObjectId, required: true }

const defineSummarySource = (originalSchema) => {
   // fires on save() and create()
   originalSchema.post('save', updateSummaries)

   originalSchema.post('findOneAndUpdate', updateSummaries)
   originalSchema.post('findByIdAndUpdate', updateSummaries)

   // TODO: How to update when update is called.
   // originalSchema.post('update', (modified, next) => {
   //    console.log('called update', modified.toString())

   //    updateSummaries(modified, next)
   // })
}

const updateSummaries = (originalDoc, next) => {
   const model = originalDoc.constructor
   const subscribers = map[model.modelName]

   if (!subscribers) {
      return next()
   }

   subscribers.forEach(subscriber => {
      const conditions = { [subscriber.field + '._id']: originalDoc._id }
      const doc = {}
      doc[subscriber.field] = originalDoc
      doc[subscriber.field]._id = originalDoc._id
      // console.log('updates', subscriber.model.modelName, conditions, require('util').inspect(doc, null, null) )

      // Driver usage?
      // mongoose.connection.db.collection(subscriber.model.modelName, (err, collection) => {
      //    if (err) {
      //       return next(err)
      //    }

      //    collection.update(conditions, doc, {
      //       multi: true,
      //       runValidators: true,
      //       overwrite: false
      //    })
      // })
      subscriber.model.update(conditions, doc, {
         multi: true,
         runValidators: true,
         overwrite: false
      }, (error) => {
         if (error) {
            return next(error)
         }
      })
   })
   next()
}

const summarize = function (subscriberSchema, options) {
   const refModelName = options.ref_model.modelName
   const summarySchema = subscriberSchema.obj[options.field].obj

   // Enforce having an required _id field in the summary schema
   if (!summarySchema._id || (summarySchema._id.schemaName === 'ObjectId' && summarySchema._id.required === true)) {
      throw new Error('The schema requires an `_id` field in the summary schema in the `' +
         options.field + '` field.')
   }

   // Ensure population of field
   subscriberSchema.pre('validate', function (next) {
      const originalDoc = this
      const docId = originalDoc[options.field]._id

      options.ref_model.findById(docId, (err, refDoc) => {
         if (err) {
            return next(err)
         }

         if (!refDoc) {
            return next(new Error('No document found in the ' + refModelName + ' reference with _id ' + docId))
         }

         originalDoc[options.field] = refDoc
         next()
      })
   })

   subscriberSchema.statics.listenForSourceChanges = function () {
      const model = this
      const subscribers = map[refModelName] || []

      subscribers.push({
         model: model,
         field: options.field
      })

      map[refModelName] = subscribers
      return model
   }
}

module.exports = exports = summarize
exports.defineSummarySource = defineSummarySource
