const { gql } = require('apollo-server')

module.exports.typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: String!
    id: ID!
    genres: [String]!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allAuthors: [Author]
    allBooks(author: String, genre: String): [Book]
  }

  type Mutation {
    addBook(title: String!, author: String!, published: Int, genres: [String!]): Book!
    editAuthor(name: String!, setBornTo: Int): Author!
  }
`