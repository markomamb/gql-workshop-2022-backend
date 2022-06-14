const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('./config')
const User = require('./models/user')

module.exports.context = async ({ req }) => {
  const auth = req ? req.headers.authorization : null
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const decodedToken = jwt.verify(
      auth.substring(7), JWT_SECRET
    )
    const currentUser = await User
      .findById(decodedToken.id)

    return { currentUser }
  }
  return {}
}