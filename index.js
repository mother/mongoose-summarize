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
         const conditions = { [subscriber.path + '._id']: originalDoc._id }
         const doc = {}
         doc[subscriber.path] = originalDoc
         doc[subscriber.path]._id = originalDoc._id
         console.log('updates', subscriber.model.modelName, conditions, require('util').inspect(doc, null, null) )

         subscriber.model.update(conditions, doc, { multi: true, runValidators: true, overwrite: false }, function() {
            console.log(arguments)
         })
      })
   })
}

const summarize = function (subscriberSchema, options) {
   // Ensure population of field
   // subscriberSchema.pre('validate', function() {
   //
   // })

   subscriberSchema.statics.listenForSourceChanges = function () {
      const model = this
      const subscribers = map[options.ref] || []

      subscribers.push({
         model: model,
         path: options.path
      })

      map[options.ref] = subscribers
      return model
   }
}

module.exports = exports = summarize
exports.defineSummarySource = defineSummarySource
