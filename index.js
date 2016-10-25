const mongoose = require('mongoose')
const modelMap = {}
const subscriberMap = {}

const defineSummarySource = (originalSchema) => {

   originalSchema.statics.listenForUpdates = function () {
      const model = this
      modelMap[model.modelName] = model
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
   const subscribers = subscriberMap[sourceModel.modelName]

   if (!subscribers) {
      return
   }

   subscribers.forEach(subscriber => {
      const conditions = { [subscriber.path + '._id']: sourceDoc._id }
      const doc = {}
      doc[subscriber.path] = sourceDoc
      doc[subscriber.path]._id = sourceDoc._id

      subscriber.model.update(conditions, doc, { multi: true }, function(err) {
         if (err) return
      })
   })
}

const summarize = function (subscriberSchema, options) {
   const summarySchema = subscriberSchema.obj[options.path]

   // Enforce having a required _id path in the summary schema
   if (!summarySchema.path('_id') || summarySchema.path('_id').options.required !== true) {
      throw new Error('The schema requires an `_id` path in the summary schema in the `' +
         options.path + '` path.')
   }

   // Ensure _id is indexed for quick querying
   // TODO: Document this, so developer is not surprised
   summarySchema.index({ _id: 1 })

   // Set summary doc
   subscriberSchema.pre('validate', function (next) {
      const originalDoc = this
      const docId = originalDoc[options.path]._id
      const refModel = modelMap[options.ref]

      refModel.findById(docId, (err, refDoc) => {
         if (err) {
            return next(err)
         }

         if (!refDoc) {
            return next(new Error('No document found in the ' + refModel.modelName + ' reference with _id ' + docId))
         }

         originalDoc[options.path] = refDoc
         next()
      })
   })

   subscriberSchema.statics.listenForSourceChanges = function () {
      const model = this
      const subscribers = subscriberMap[options.ref] || []

      subscribers.push({
         model: model,
         path: options.path
      })

      subscriberMap[options.ref] = subscribers
      return model
   }
}

module.exports = exports = summarize
exports.defineSummarySource = defineSummarySource
