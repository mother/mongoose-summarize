const mongoose = require('mongoose')
const refMap = {}
const summaryMap = {}

const defineSummarySource = (originalSchema) => {

   originalSchema.statics.listenForUpdates = function () {
      const model = this
      refMap[model.modelName] = model
   }

   // Fires on save and create events
   originalSchema.post('save', updateSummaries)

   // Fires on any findAndUpdate calls
   originalSchema.post('findOneAndUpdate', updateSummaries)

   // Fires on update query
   originalSchema.post('update', function() {
      const query = this.getQuery()
      const model = this.model // This is using an undocumented property from Query :(
      model.find(query).exec((err, results) => {
         if (err) return
         results.forEach(updateSummaries)
      })
   })
}

const updateSummaries = (sourceDoc) => {
   const sourceModel = sourceDoc.constructor
   const subscribers = summaryMap[sourceModel.modelName]

   if (!subscribers) {
      return
   }

   subscribers.forEach(subscriber => {
      const conditions = { [subscriber.field + '._id']: sourceDoc._id }
      const doc = {}
      doc[subscriber.field] = sourceDoc
      doc[subscriber.field]._id = sourceDoc._id

      subscriber.model.update(conditions, doc, { multi: true }, function(err) {
         if (err) return
      })
   })
}

const summarize = function (subscriberSchema, options) {
   const summarySchema = subscriberSchema.obj[options.field]

   // Enforce having a required _id field in the summary schema
   if (!summarySchema.path('_id') || summarySchema.path('_id').options.required !== true) {
      throw new Error('The schema requires an `_id` field in the summary schema in the `' +
         options.field + '` field.')
   }

   // Ensure _id is indexed for quick querying
   // TODO: Document this, so developer is not surprised
   summarySchema.index({ _id: 1 })

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
