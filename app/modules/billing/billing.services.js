const { ctr, rabbitmq } = require('@cowellness/cw-micro-service')()

rabbitmq.consume('/billing/process', () => {
  return ctr.billing.process()
})

// schedule cron
rabbitmq.send('/cron/append', {
  name: 'billing:process',
  type: 'cron',
  update: true,
  crontab: '0 0 * * *',
  commands: [{
    type: 'rabbitmq',
    queue: '/billing/process',
    msg: 'process billing'
  }]
})
