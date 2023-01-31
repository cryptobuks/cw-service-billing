const _ = require('lodash')

module.exports = ({ name, type, params } = {}) => {
  const ControllerName = _.capitalize(name)

  return `const { db } = require('@cowellness/cw-micro-service')()

/**
 * @class ${ControllerName}Controller
 * @classdesc Controller ${ControllerName}
 */
class ${ControllerName}Controller {
  constructor () {
    this.${ControllerName} = db.data.model('${ControllerName}')
  }

  find () {
    return this.${ControllerName}.find({})
  }
}

module.exports = ${ControllerName}Controller
`
}
