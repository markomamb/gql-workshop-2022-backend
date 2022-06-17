const { ApolloServer, UserInputError, AuthenticationError } = require('apollo-server')
const { context } = require('./context')
const { typeDefs } = require('./typeDefs')

const mongoose = require('mongoose')
const { resolvers } = require('./resolvers')

const MONGODB_URI = 'mongodb://localhost:27017/fullstackopen'

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })



const server = new ApolloServer({
  typeDefs,
  resolvers,
  context
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})

