const { gql } = require('apollo-server')

module.exports.typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    title: String!
    published: Int!
    author: String!
    id: ID!
    genres: [String!]!
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
    me: User
    genres: [String!]!
  }

  input CreateBookInput {
    title: String!
    author: String!
    published: Int!
    genres: [String!]!
  }

  type Mutation {
    addBook(input: CreateBookInput!): Book!
    editAuthor(name: String!, setBornTo: Int): Author!
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`