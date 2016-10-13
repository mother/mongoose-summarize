const mongoose = require('mongoose')
const refMap = {}
const summaryMap = {}

// TODO: Check schema strictness
// TODO: Check if relevant fields were actually modified
// TODO: Autoindex dependencies
// TODO: Remove options
// TODO: How to update when update is called.

const defineSummarySource = (originalSchema) => {

   originalSchema.statics.listenForUpdates = function () {
      const model = this
      refMap[model.modelName] = model
   }

   // fires on save() and create()
   originalSchema.post('save', updateSummaries)

   // fires on any find and update calls
   originalSchema.post('findOneAndUpdate', updateSummaries)
}

const updateSummaries = (originalDoc, next) => {
   const model = originalDoc.constructor
   const subscribers = summaryMap[model.modelName]

   if (!subscribers) {
      return next()
   }

   subscribers.forEach(subscriber => {
      const conditions = { [subscriber.field + '._id']: originalDoc._id }
      const doc = {}
      doc[subscriber.field] = originalDoc
      doc[subscriber.field]._id = originalDoc._id
      // console.log('updates', subscriber.model.modelName, conditions, require('util').inspect(doc, null, null) )

      subscriber.model.findOneAndUpdate(conditions, doc, {
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
      const refModel = refMap[options.ref]

      refModel.findById(docId, (err, refDoc) => {
         if (err) {
            return next(err)
         }

         if (!refDoc) {
            return next(new Error('No document found in the ' + refModel.modelName + ' reference with _id ' + docId))
         }

         originalDoc[options.field] = refDoc
         next()
      })
   })

   subscriberSchema.statics.listenForSourceChanges = function () {
      const model = this
      const subscribers = summaryMap[options.ref] || []

      subscribers.push({
         model: model,
         field: options.field
      })

      summaryMap[options.ref] = subscribers
      return model
   }
}

module.exports = exports = summarize
exports.defineSummarySource = defineSummarySource
