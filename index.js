const map = {}

// TODO: Check schema strictness
// TODO: Check if relevant fields were actually modified
// TODO: Autoindex dependencies
// TODO: Remove options
// TODO: Enforce _id: { type : Schema.Types.ObjectId, required: true }

const defineSummarySource = function (originalSchema) {
   originalSchema.post('save', (originalDoc) => {
      const model = originalDoc.constructor
      const subscribers = map[model.modelName]

      subscribers.forEach(subscriber => {
         const conditions = { [subscriber.field + '._id']: originalDoc._id }
         const doc = {}
         doc[subscriber.field] = originalDoc
         doc[subscriber.field]._id = originalDoc._id
         console.log('updates', subscriber.model.modelName, conditions, require('util').inspect(doc, null, null) )

         subscriber.model.update(conditions, doc, { multi: true, runValidators: true, overwrite: false }, function() {
            console.log(arguments)
         })
      })
   })
}

const summarize = function (subscriberSchema, options) {
   // Ensure population of field
   subscriberSchema.pre('validate', function (originalDoc) {
      const model = this
      console.log(originalDoc)
      originalDoc[options.field] = model[options.field].findById(originalDoc[options.field])
      console.log(originalDoc)
   })

   subscriberSchema.statics.listenForSourceChanges = function () {
      const model = this
      const subscribers = map[options.ref] || []

      subscribers.push({
         model: model,
         field: options.field
      })

      map[options.ref] = subscribers
      return model
   }
}

module.exports = exports = summarize
exports.defineSummarySource = defineSummarySource
