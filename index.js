const { ApolloServer, UserInputError, AuthenticationError } = require('apollo-server')
const { v1: uuid } = require('uuid')
const { context } = require('./context')
const { typeDefs } = require('./typeDefs')

const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const { JWT_SECRET } = require('./config')
const jwt = require('jsonwebtoken')

const MONGODB_URI = 'mongodb://localhost:27017/fullstackopen'

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })



const resolvers = {
  Query: {
    bookCount: () => {
      return Book.collection.countDocuments()
    },
    authorCount: () => {
      return Author.collection.countDocuments()
    },
    allBooks: async (root, args, context, info) => {
      const author = args.author
      const genre = args.genre

      const books = await Book.find({}).populate('author')
      const booksWithAuthorName = books.map(includeAuthorName)

      return booksWithAuthorName
        .filter(book => author !== undefined ? book.author.name === author : true)
        .filter(book => genre !== undefined ? book.genres.includes(genre) : true)
    },
    allAuthors: async () => {
      return await Author.find({})
    },
    me: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated')
      }
      return context.currentUser
    },
    genres: async () => {
      const books = await Book.find({})
      const genres = books.map(b => b._doc).flatMap(b => b.genres)

      return new Set(genres)
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('not authenticated')
      }

      const { title, author, published, genres } = args.input

      if (title.length < 2) {
        throw new UserInputError('Book title too short.')
      }

      if (author.length < 4) {
        throw new UserInputError('Author name too short.')
      }

      const authorFound = await Author.findOne({ name: author })

      let newBook
      if (authorFound) {
        newBook = new Book({ title, author: authorFound._id, published, genres })
      } else {
        const newAuthor = new Author({
          name: author,
          born: null
        })

        const saved = await newAuthor.save()
        newBook = new Book({ title, author: newAuthor._id, published, genres })
      }

      await newBook.save()

      return newBook
    },
    editAuthor: async (root, args) => {
      try {
        const res = await Author.updateOne({ name: args.name }, { born: args.setBornTo })
        // TODO: oikean id:n palautus
        return { name: args.name, born: args.setBornTo, id: '' }
      } catch (ex) {
        console.error('Update failed.')
        return null
      }
    },
    createUser: async (root, args) => {
      const { username, favoriteGenre } = args

      if (username.length < 4) {
        throw new UserInputError('Username too short.')
      }
      const user = new User({ username, favoriteGenre })
      const res = await user.save()

      return user
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'password') {
        throw new UserInputError("wrong credentials")
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    }
  },
  Author: {
    bookCount: async (root) => {
      const books = await Book.find({}).populate('author')
      const booksWithAuthorName = books.map(includeAuthorName)
      return booksWithAuthorName.filter(book => book.author === root.name).length
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})

const includeAuthorName = b => {
  return { ...b._doc, author: b._doc.author.name, id: b._doc._id }
}