const { db, rabbitmq, dayjs, es, envPrefix, _, log } = require('@cowellness/cw-micro-service')()

/**
 * @class BillingController
 * @classdesc Controller Billing
 */
class BillingController {
  constructor () {
    this.Billing = db.billing.model('Billing')
  }

  async getPriceList (countryCode) {
    const { data: countries } = await rabbitmq.sendAndRead('/settings/countries/get')
    const country = countries.find(country => country.code === countryCode)

    if (!country) {
      return []
    }
    const { data: priceList } = await rabbitmq.sendAndRead('/settings/countries/priceList/get', {
      countryId: country._id
    })

    return priceList
  }

  async getGymList () {
    const { data: gymModules } = await rabbitmq.sendAndRead('/auth/cwmodules/getGymList')

    return gymModules
  }

  async getCowellnessProfile (code) {
    const { data: profile } = await rabbitmq.sendAndRead('/auth/profile/getCowellnessByCountry', {
      code
    })

    return profile
  }

  async addWalletTransaction (data) {
    const { data: transaction } = await rabbitmq.sendAndRead('/wallet/transaction/add', data)

    return transaction
  }

  async process () {
    const gymModules = await this.getGymList()
    const gymPriceList = await Promise.all(gymModules.map(gym => {
      return this.getPriceList(gym.company.country).then(priceList => {
        gym.priceList = priceList
        return gym
      })
    }))
    const billingData = []
    const transactions = []
    for (const gym of gymPriceList) {
      for (const m of gym.cwModules) {
        if (!m.modules.isActive) {
          log.info('Process: discounts module not active')
          // module is not active, do nothing
          return
        }
        const area = m.modules.area
        const priceData = gym.priceList.find(pricelist => pricelist.name === area)
        const activePrice = priceData.data.find(price => price.status === 'active')
        const discounts = m.modules.discounts.filter(d => {
          return d.endDt > parseInt(dayjs().format('YYYYMMDD'))
        }).map(d => d.discount)

        if (!activePrice) {
          log.info('Price not found')
          // price not found, do nothing
          return
        }
        const cwProfile = await this.getCowellnessProfile(gym.company.country)

        let count = 1
        if (priceData.paid === 'activeContact') {
          // no. of active contacts
          count = await this.getActiveContacts(gym._id)
          // if active contacts not found set to default 1
          if (!count) {
            count = 1
          }
        }
        if (priceData.oneOff) {
          const billing = {}
          billing.profileId = gym._id
          billing.cwmodule = area
          billing.submodule = 'oneOff'
          billing.price = activePrice.oneOff
          billing.netPrice = activePrice.oneOff
          billing.discounts = discounts
          billing.count = count
          discounts.forEach(discount => {
            billing.netPrice -= discount
          })
          billing.total = billing.netPrice * billing.count
          billingData.push(billing)
          if (cwProfile) {
            transactions.push({
              gymId: cwProfile._id,
              profileId: gym._id,
              type: 'subscription',
              amount: billing.total,
              gateway: null
            })
          }
        }
        if (priceData.forYear) {
          const billing = {}
          billing.profileId = gym._id
          billing.cwmodule = area
          billing.submodule = 'forYear'
          billing.price = activePrice.forYear
          billing.netPrice = activePrice.forYear
          billing.discounts = discounts
          billing.count = count
          discounts.forEach(discount => {
            billing.netPrice -= discount
          })

          billing.total = billing.netPrice * billing.count
          billingData.push(billing)
          if (cwProfile) {
            transactions.push({
              gymId: cwProfile._id,
              profileId: gym._id,
              type: 'subscription',
              amount: billing.total,
              gateway: null
            })
          }
        }
      }
    }

    await this.createBilling(billingData)
    await Promise.all(transactions.map(transaction => this.addWalletTransaction(transaction)))
  }

  async getActiveContacts (gymId) {
    const result = await es.search({
      index: envPrefix + 'relations',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  leftProfileId: gymId
                }
              },
              {
                match: {
                  status: 'active'
                }
              },
              {
                match: {
                  isInteresting: true
                }
              }
            ]
          }
        }
      }
    })
    const relations = _.get(result, 'hits.hits', []).map(r => r._source)

    const profiles = await es.count({
      index: envPrefix + 'profiles',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  _id: relations.map(r => r.rightProfileId).join(' OR ')
                }
              },
              {
                match: {
                  status: 'active'
                }
              }
            ]
          }
        }
      }
    })
    return profiles.count
  }

  createBilling (data) {
    return this.Billing.create(data)
  }
}

module.exports = BillingController
