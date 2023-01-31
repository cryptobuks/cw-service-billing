const _ = require('lodash')

module.exports = ({ name, type, params } = {}) => {
  const modelName = _.capitalize(name)

  return `const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.data.Schema

const newSchema = new Schema(
  {
    name: {
      type: String
    }
  },
  { timestamps: true }
)

module.exports = db.data.model('${modelName}', newSchema)
`
}
