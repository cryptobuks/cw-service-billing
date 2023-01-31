module.exports = ({ name, type, params } = {}) => `const { ctr } = require('@cowellness/cw-micro-service')()

module.exports = async function (fastify, opts, done) {
  fastify.get('/', function (request, reply) {
    ctr.${name}.find().then((list) => {
      reply.send({ result: 'ok', list })
    })
  })
}
`
