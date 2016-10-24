# mongoose-summarize

To minimize populates and improve performance, we dereference data that is accessed frequently and is changed seldom.

To make it very easy to manage dereferenced data, we invented a technique and a plugin we call summarization.

Take the User schema for example.

````
const UserSchema = new mongoose.Schema({

   email: { type: String, required: true },
   phone: { type: String },
   name: {
      first: { type: String, required: true },
      last: { type: String, required: true }
   },

   avatar: {
      file: { type: Schema.Types.ObjectId, ref: 'file' },
      url: { type: String } // generated
   },

   credentials: {
      encrypted_password: { type: String },
      reset_request: {
         code: { type: String, trim: true },
         date: { type: Date },
         expires: { type: Date }
      }
   },

   ...
````

When other collections contain dereferenced user data, they do not need to store all user data obviously. Let's say only the name and avatar need to be stored. We can let our plugin to only store these fields when the user is being dereferenced (the "summary"):

````
const UserSummarySchema = new mongoose.Schema({
   _id: { type: Schema.Types.ObjectId, required: true },
   name: {
      first: { type: String, trim: true },
      last: { type: String, trim: true }
   },
   avatar: {
      url: { type: String }
   }
})

module.exports = exports = UserSummarySchema
````

And then in the original schema:

````
UserSchema.plugin(summarize.defineSummarySource)
````

For creating the original model from the above schema:

```
const UserSchema = require('<PATH_TO_SCHEMAS>/user')
mongoose.model('user', UserSchema).listenForUpdates()
```
Then to use the summary in another schema:

````
const CommentSchema = new mongoose.Schema({
   author: UserSummarySchema,
   body: { type: String },
   added: {
      date: { type: Date, default: Date.now }
   }
})

CommentSchema.plugin(summarize, { field: 'author', ref: 'user' })

mongoose.model('comment', CommentSchema).listenForSourceChanges()
````

This plugin will setup a pub/sub system so that anytime a document in the source collection (eg. users) is updated, the plugin can optionally do batch updates on the schemas that use the summaries to ensure dereferenced data is kept up to date. This should be fairly performant if we setup indeces on the id field of summary documents.

TODO:
- [ ] Check schema strictness
- [ ] Check if relevant fields were actually modified
- [ ] Autoindex dependencies
- [ ] Remove options
- [ ] Update summaries on mongoose `update` call
- [ ] Add 'updated' timestamp to summary documents automatically
- [ ] Handle mis-syncronization
- [ ] Nested Summarizations?
- [ ] Evaluate tradeoff between performance and additional storage requirements, especially if a caching system is in place
- [ ] Deletion of original document: can either delete document containing summary, or update summary, or do nothing
- [ ] Summarized documents within arrays
