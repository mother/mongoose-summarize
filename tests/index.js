const expect = require('chai').expect
const mongoose = require('mongoose')
const ms = require('ms')

const config = require('./config')
const summarize = require('../')

const User = mongoose.model('user')
const Comment = mongoose.model('comment')
const setup = config.setup
const teardown = config.teardown

const WAIT_TIME = ms('500ms')

describe('Test Summarize:', function () {
   this.timeout(15000)
   const userData = {
      email: 'test@testing.com',
      name: {
         first: 'Test',
         last: 'Testing',
         full: 'Test Testing'
      },
      'credentials.encrypted_password': 'X13$sWtP'
   }
   const commentText = 'This is a test comment'
   const firstName = 'newTest'
   const url = 'http://test.com/img.jpg'
   const phone = '123-456-7890'
   let newUser
   let newComment

   before(setup)
   beforeEach((done) => {
      newUser = new User(userData)

      newUser.save((err, user) => {
         if (err) {
            return done(err)
         }

         newComment = new Comment({
            author: { _id: newUser._id },
            body: commentText
         })
         newComment.save(done)
      })
   })

   after(teardown)
   afterEach((done) => { newUser.remove(done) })

   it('Should save a reference document', (done) => {
      User.count({}, (err, count) => {
         expect(err).to.not.be.ok
         expect(count).to.equal(1)
         done(err)
      })
   })

   it('Should fetch the properties of the author of the new comment - using user id', (done) => {
      Comment.findOne({ 'author._id': newUser._id }, (err, comment) => {
         expect(err).to.not.be.ok
         expect(comment).to.be.ok
         expect(comment.author.name.first).to.equal(newUser.name.first)
         expect(comment.author.name.last).to.equal(newUser.name.last)
         expect(comment.author.avatar.url).to.equal(newUser.avatar.url)
         expect(comment.author.avatar.url).to.equal(undefined)
         expect(comment.body).to.equal(commentText)

         done(err)
      })
   })

   it('Should fetch the properties of the author of the new comment - using author\'s info', (done) => {
      setTimeout(() => {
         Comment.findOne({
            'author.name.first': newUser.name.first,
            'author.name.last': newUser.name.last
         }, (err, comment) => {
            expect(err).to.not.be.ok
            expect(comment).to.be.ok
            expect(comment.author.name.first).to.equal(newUser.name.first)
            expect(comment.author.name.last).to.equal(newUser.name.last)
            expect(comment.author.avatar.url).to.equal(newUser.avatar.url)
            expect(comment.author.avatar.url).to.equal(undefined)
            expect(comment.body).to.equal(commentText)

            done(err)
         })
      }, WAIT_TIME)
   })

   it('Should updates the summary when using `save` on the reference model', (done) => {
      newUser.name.first = firstName
      newUser.avatar.url = url
      newUser.phone = phone
      newUser.save((err, user) => {
         expect(err).to.not.be.ok

         setTimeout(() => {
            Comment.findOne({ 'author._id': newUser._id }, (error, comment) => {
               expect(error).to.not.be.ok
               expect(comment).to.be.ok
               expect(comment.author.name.first).to.equal(user.name.first)
               expect(comment.author.name.first).to.not.equal(userData.name.first)
               expect(comment.author.name.last).to.equal(user.name.last)
               expect(comment.author.avatar.url).to.equal(user.avatar.url)
               expect(comment.author.avatar.url).to.not.equal(undefined)
               expect(comment.body).to.equal(commentText)

               done(error)
            })
         }, WAIT_TIME)
      })
   })

   it('Should updates the summary when using `findOneAndUpdate` on the reference model', (done) => {
      User.findOneAndUpdate({ _id: newUser._id }, {
         'name.first': firstName,
         'avatar.url': url,
         phone: phone
      }, { new: true }, (err, user) => {
         expect(err).to.not.be.ok

         setTimeout(() => {
            Comment.findOne({ 'author._id': newUser._id }, (error, comment) => {
               expect(error).to.not.be.ok
               expect(comment).to.be.ok
               expect(comment.author.name.first).to.equal(user.name.first)
               expect(comment.author.name.first).to.not.equal(newUser.name.first)
               expect(comment.author.name.last).to.equal(newUser.name.last)
               expect(comment.author.avatar.url).to.equal(user.avatar.url)
               expect(comment.author.avatar.url).to.not.equal(undefined)
               expect(comment.body).to.equal(commentText)

               done(error)
            })
         }, WAIT_TIME)
      })
   })

   it('Should updates the summary when using `findByIdAndUpdate` on the reference model', (done) => {
      User.findByIdAndUpdate(newUser._id, {
         'name.first': firstName,
         'avatar.url': url,
         phone: phone
      }, { new: true }, (err, user) => {
         expect(err).to.not.be.ok

         setTimeout(() => {
            Comment.findOne({ 'author._id': newUser._id }, (error, comment) => {
               expect(error).to.not.be.ok
               expect(comment).to.be.ok
               expect(comment.author.name.first).to.equal(user.name.first)
               expect(comment.author.name.first).to.not.equal(newUser.name.first)
               expect(comment.author.name.last).to.equal(newUser.name.last)
               expect(comment.author.avatar.url).to.equal(user.avatar.url)
               expect(comment.author.avatar.url).to.not.equal(undefined)
               expect(comment.body).to.equal(commentText)

               done(error)
            })
         }, WAIT_TIME)
      })
   })

   it('Should accept multiple summaries from the same schema, with the same reference model', (done) => {
      const NewComment = mongoose.model('new_comment', require('./schemas/comment')).listenForSourceChanges()
      const newCommentText1 = 'new comment!'
      const newCommentText2 = 'new comment again!'

      newComment = new NewComment({
         author: { _id: newUser._id },
         body: newCommentText1
      })
      newComment.save()

      comment = new Comment({
         author: { _id: newUser._id },
         body: newCommentText2
      })
      comment.save()

      setTimeout(() => {
         NewComment.findOne({
            'author._id': newUser._id,
            body: newCommentText1
         }, (err, comment) => {
            expect(err).to.not.be.ok
            expect(comment).to.be.ok
            expect(comment.author.name.first).to.equal(newUser.name.first)
            expect(comment.author.name.last).to.equal(newUser.name.last)
            expect(comment.author.avatar.url).to.equal(undefined)

            Comment.findOne({
               'author._id': newUser._id,
               body: newCommentText2
            }, (err, comment) => {
               expect(err).to.not.be.ok
               expect(comment).to.be.ok
               expect(comment.author.name.first).to.equal(newUser.name.first)
               expect(comment.author.name.last).to.equal(newUser.name.last)
               expect(comment.author.avatar.url).to.equal(undefined)

               done(err)
            })
         })
      }, WAIT_TIME)
   })

   it('Should update all the summary documents after the reference document got updated', (done) => {
      const comment = new Comment({
         author: { _id: newUser._id },
         body: commentText
      })
      comment.save((err, com) => {
         expect(err).to.not.be.ok
         expect(com).to.be.ok
         expect(comment.author.name.first).to.equal(newUser.name.first)

         newUser.name.first = firstName
         newUser.save((error, user) => {
            expect(error).to.not.be.ok

            setTimeout(() => {
               Comment.findById(newComment._id, (e1, com1) => {
                  expect(e1).to.not.be.ok
                  expect(com1).to.be.ok
                  expect(com1.author.name.first).to.equal(user.name.first)
                  expect(com1.author.name.first).to.equal(firstName)
                  expect(com1.author.name.last).to.equal(user.name.last)

                  Comment.findById(comment._id, (e2, com2) => {
                     expect(e2).to.not.be.ok
                     expect(com2).to.be.ok
                     expect(com2.author.name.first).to.equal(user.name.first)
                     expect(com2.author.name.first).to.equal(firstName)
                     expect(com2.author.name.last).to.equal(user.name.last)

                     done(e2)
                  })
               })
            }, WAIT_TIME)
         })
      })
   })

   it('Should give error on non-existing user document', (done) => {
      newComment = new Comment({
         author: { _id: '57d9ca3a019c30ed2c4aaad1' },
         body: commentText
      })
      newComment.save((err, comment) => {
         expect(err).to.be.ok
         expect(comment).to.not.be.ok
         expect(err.message).to.include('No document found in the ' + User.modelName
            + ' reference with _id 57d9ca3a019c30ed2c4aaad1')

         done()
      })
   })

   it('Should give error on having a summary schema with no `_id` field', () => {
      const SummaryScheme = new mongoose.Schema({ name: String })
      const TestScheme = new mongoose.Schema({ test: SummaryScheme })

      const options = { field: 'test', ref_model: User }
      expect(summarize.bind(this, TestScheme, options)).to.throw(Error,
         /field in the summary schema in the/)
   })
})
