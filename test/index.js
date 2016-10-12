const expect = require('chai').expect
const mongoose = require('mongoose')
const ms = require('ms')

const setup = require('./setup')
const summarize = require('../')

const User = mongoose.model('user', require('./schemas/user'))
const UserSummary = mongoose.model('user.summary', require('./schemas/user.summary'))
const Comment = mongoose.model('comment', require('./schemas/comment')).listenForSourceChanges()

const WAIT_TIME = ms('500ms')

describe('Test Summarize - ', function () {
   this.timeout(15000)
   const userData = {
      email: 'test@testing.com',
      name: {
         first: 'Test',
         last: 'Testing',
         full: 'Test Testing'
      },
      'password.encrypted_password': 'X13$sWtP'
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
            author: { _id: user._id },
            body: commentText
         })
         newComment.save(done)
      })
   })

   afterEach((done) => { newUser.remove(done) })

   it('defineSummarySource on save', (done) => {
      User.count({}, (err, count) => {
         expect(err).to.not.be.ok
         expect(count).to.equal(1)
         done(err)
      })
   })

   it('pre-validatation of a comment - using user id', (done) => {
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

   // TODO: Fix
   it('pre-validatation of a comment - using author\'s info', (done) => {
      setTimeout(() => {
         // Comment.find({}, (e, c) => {
         //    console.log('~~~~~~~~~~', c[0])
         // })

         Comment.findOne({
            'author.name': {
               $elemMatch: {
                  first: newUser.name.first,
                  last: newUser.name.last
               }
            }
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

   it('modifying the reference collection updates the summary using `save`', (done) => {
      newUser.name.first = firstName
      newUser.avatar.url = url
      newUser.phone = phone
      newUser.save((err, user) => {
         if (err) {
            return done(err)
         }

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

   it('modifying the reference collection updates the summary using `findOneAndUpdate`', (done) => {
      User.findOneAndUpdate({ _id: newUser._id }, {
         'name.first': firstName,
         'avatar.url': url,
         phone: phone
      }, { new: true }, (err, user) => {
         if (err) {
            return done(err)
         }

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

   it('modifying the reference collection updates the summary using `findByIdAndUpdate`', (done) => {
      User.findByIdAndUpdate(newUser._id, {
         'name.first': firstName,
         'avatar.url': url,
         phone: phone
      }, { new: true }, (err, user) => {
         if (err) {
            return done(err)
         }

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

   // TODO: Is there any way to run plugin for `on update` calls?
   // it('modifying the reference collection updates the summary using `update`', (done) => {
   //    User.update({ _id: newUser._id }, {
   //       'name.first': firstName,
   //       'avatar.url': url,
   //       phone: phone
   //    }, (err) => {
   //       if (err) {
   //          return done(err)
   //       }

   //       setTimeout(() => {
   //          Comment.findOne({ 'author._id': newUser._id }, (error, comment) => {
   //             expect(error).to.not.be.ok
   //             expect(comment).to.be.ok
   //             expect(comment.author.name.first).to.equal(firstName)
   //             expect(comment.author.name.first).to.not.equal(newUser.name.first)
   //             expect(comment.author.name.last).to.equal(newUser.name.last)
   //             expect(comment.author.avatar.url).to.equal(url)
   //             expect(comment.author.avatar.url).to.not.equal(undefined)
   //             expect(comment.body).to.equal(commentText)

   //             done(error)
   //          })
   //       }, WAIT_TIME)
   //    })
   // })

   it('error on non-existing user document', (done) => {
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
})