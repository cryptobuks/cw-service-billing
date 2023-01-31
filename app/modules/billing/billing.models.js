const { db } = require('@cowellness/cw-micro-service')()

const Schema = db.billing.Schema

const newSchema = new Schema(
  {
    profileId: {
      type: String
    },
    cwmodule: {
      type: String
    },
    submodule: {
      type: String
    },
    price: {
      type: Number
    },
    discount: [{
      type: Number
    }],
    netPrice: {
      type: Number
    },
    count: {
      type: Number
    },
    total: {
      type: Number
    }
  },
  { timestamps: true }
)

module.exports = db.billing.model('Billing', newSchema)
