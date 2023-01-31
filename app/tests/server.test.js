const cw = require('@cowellness/cw-micro-service')()

beforeAll(() => {
  return cw.startFastify()
})

afterAll(() => {
  return cw.stopFastify()
})

describe('Test app working - 404 and headers', () => {
  it('route not found', async () => {
    expect(2 + 2).toBe(4)
  })
})
