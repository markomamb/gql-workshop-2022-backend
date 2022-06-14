const { ApolloServer } = require('apollo-server')
const { v1: uuid } = require('uuid')
const { context } = require('./context')
const { typeDefs } = require('./typeDefs')

const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const { authors, books } = require('./data')

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
      console.log(context)
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
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      const { title, author, published, genres } = args.input

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
    editAuthor: (root, args) => {
      const authorIndex = authors.findIndex(a => a.name === args.name)

      if (authorIndex >= 0) {
        const editedAuthor = { ...authors[authorIndex], born: args.setBornTo }
        authors[authorIndex] = editedAuthor

        return editedAuthor
      }
      return null
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
  return { ...b._doc, author: b._doc.author.name }
}