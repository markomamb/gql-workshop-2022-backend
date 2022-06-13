const { ApolloServer } = require('apollo-server')
const { v1: uuid } = require('uuid')
const { context } = require('./context')
const { typeDefs } = require('./typeDefs')

let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  {
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const resolvers = {
  Query: {
    bookCount: () => {
      return books.length
    },
    authorCount: () => {
      return authors.length
    },
    allBooks: (root, args, context, info) => {
      console.log(context)
      const author = args.author
      const genre = args.genre

      return books
        .filter(book => author !== undefined ? book.author === author : true)
        .filter(book => genre !== undefined ? book.genres.includes(genre) : true)
    },
    allAuthors: () => {
      return authors
    }
  },
  Mutation: {
    addBook: (root, args) => {
      const { title, author, published, genres } = args
      const newBook = { title, author, published, genres, id: uuid() }

      books.push(newBook)

      if (!authors.some(a => a.name === author)) {
        const newAuthor = {
          name: author,
          born: null,
          id: uuid()
        }

        authors.push(newAuthor)
      }

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
    bookCount: (root) => {
      return books.filter(book => book.author === root.name).length
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

