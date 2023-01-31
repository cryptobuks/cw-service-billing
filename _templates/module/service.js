module.exports = ({ name, type, params } = {}) => `const { ctr,rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/settings/${name}/get', (msg) => {
  const filter = msg.data
  return ctr.${name}.find(filter)
})
`
