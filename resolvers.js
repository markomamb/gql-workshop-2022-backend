const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const { JWT_SECRET } = require('./config')
const jwt = require('jsonwebtoken')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()
const { UserInputError } = require('apollo-server')

module.exports.resolvers = {
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
        .filter(book => author !== undefined ? book.author === author : true)
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
      const book = await Book.findById(newBook._id).populate('author')
      const bookWithAuthorName = includeAuthorName(book)

      pubsub.publish('BOOK_ADDED', { bookAdded: bookWithAuthorName })
      return bookWithAuthorName
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
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  }
}

const includeAuthorName = b => {
  return { ...b._doc, author: b._doc.author.name, id: b._doc._id }
}