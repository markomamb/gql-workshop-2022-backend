module.exports.context = ({ req }) => {
  const appContext = {
    username: 'Test user',
    roles: ['RoleA', 'RoleB']
  }

  return appContext
}