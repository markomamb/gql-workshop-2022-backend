require('dotenv').config()

const { ApolloServer } = require('apollo-server-express')
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core')
const { context } = require('./context')
const { typeDefs } = require('./typeDefs')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const express = require('express')
const http = require('http')

const { execute, subscribe } = require('graphql')
const { SubscriptionServer } = require('subscriptions-transport-ws')

const mongoose = require('mongoose')
const { resolvers } = require('./resolvers')

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })


const start = async () => {
  const app = express()
  const httpServer = http.createServer(app)

  const schema = makeExecutableSchema({ typeDefs, resolvers })

  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: httpServer,
      path: '',
    }
  )

  const server = new ApolloServer({
    schema,
    context,
    plugins: [
      // It is highly recommended that you use this plugin with packages like apollo-server-express 
      // if you want your server to shut down gracefully.
      // NOTICE: apollo-server package automatically uses this plugin internally
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart () {
          return {
            async drainServer () {
              subscriptionServer.close()
            },
          }
        },
      }
    ],
  })

  await server.start()

  server.applyMiddleware({
    app,
    path: '/',
  })

  const PORT = 4000

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`)
  )
}

start()


