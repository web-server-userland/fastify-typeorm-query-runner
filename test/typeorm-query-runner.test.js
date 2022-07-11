const test = require('ava')
const Fastify = require('fastify')
const fastifyTypeORMQueryRunner = require('..')

test('miss dataSource params', async t => {
  t.plan(1)

  const fastify = Fastify()
  fastify.register(fastifyTypeORMQueryRunner, {
    transaction: true
  }).ready().catch(err => {
    t.truthy(err)
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.inject({
    method: 'GET',
    url: '/'
  })
})

test('miss dataSource.createQueryRunner', async t => {
  t.plan(1)

  const fastify = Fastify()
  fastify.register(fastifyTypeORMQueryRunner, {
    transaction: true,
    dataSource: {}
  }).ready().catch(err => {
    t.truthy(err)
  })

  fastify.get('/', (req, reply) => {
    reply.send('ok')
  })

  await fastify.inject({
    method: 'GET',
    url: '/'
  })
})

test('match router', async t => {
  t.plan(1)

  const random = Math.random()
  const fastify = Fastify()
  fastify.register(fastifyTypeORMQueryRunner, {
    dataSource: {
      createQueryRunner: () => random
    },
    match: (request) => {
      return request.routerPath === '/xx'
    }
  })

  fastify.get('/xx', (req, reply) => {
    t.is(req.queryRunner, random)
    reply.send('ok')
  })

  await fastify.inject({
    method: 'GET',
    url: '/xx'
  })
})

test('not match router', async t => {
  t.plan(0)

  const random = Math.random()
  const fastify = Fastify()
  fastify.register(fastifyTypeORMQueryRunner, {
    dataSource: {
      createQueryRunner: () => random
    },
    match: (request) => {
      return request.routerPath === '/'
    }
  })

  fastify.get('/xx', (req, reply) => {
    throw new Error('xx')
  })

  await fastify.inject({
    method: 'GET',
    url: '/xx'
  })
})

test('transaction should start / release', async t => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(fastifyTypeORMQueryRunner, {
    dataSource: {
      createQueryRunner: () => ({
        startTransaction: t.pass,
        commitTransaction: t.fail,
        rollbackTransaction: t.fail,
        release: t.pass
      })
    },
    transaction: true
  })

  fastify.get('/', (req, reply) => {
    t.truthy(req.queryRunner)
    reply.send('ok')
  })

  await fastify.inject({
    method: 'GET',
    url: '/'
  })
})

test('transaction already released', async t => {
  t.plan(1)

  const fastify = Fastify()

  fastify.register(fastifyTypeORMQueryRunner, {
    dataSource: {
      createQueryRunner: () => ({
        startTransaction: t.pass,
        commitTransaction: t.fail,
        rollbackTransaction: t.fail,
        release: t.fail,
        isTransactionActive: true,
        isReleased: true
      })
    },
    transaction: true
  })

  fastify.get('/', (req, reply) => {
    throw new Error('test')
  })

  await fastify.inject({
    method: 'GET',
    url: '/'
  })
})

test('transaction should start / commit / release', async t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(fastifyTypeORMQueryRunner, {
    dataSource: {
      createQueryRunner: () => ({
        startTransaction: t.pass,
        commitTransaction: t.pass,
        rollbackTransaction: t.fail,
        release: t.pass,
        isTransactionActive: true
      })
    },
    transaction: true
  })

  fastify.get('/', (req, reply) => {
    t.truthy(req.queryRunner)
    reply.send('ok')
  })

  await fastify.inject({
    method: 'GET',
    url: '/'
  })
})

test('respIsError', async t => {
  t.plan(4)

  const fastify = Fastify()
  fastify.register(fastifyTypeORMQueryRunner, {
    dataSource: {
      createQueryRunner: () => ({
        startTransaction: t.pass,
        commitTransaction: t.fail,
        rollbackTransaction: t.pass,
        release: t.pass,
        isRelease: false,
        isTransactionActive: true
      })
    },
    transaction: true,
    respIsError: (str) => str === '{"status":false}'
  })

  fastify.get('/xx', (req, reply) => {
    reply.send({
      status: false
    })
  })

  const result = (await fastify.inject({
    method: 'GET',
    url: '/xx'
  })).json()

  t.is(result.status, false)
})

test('transaction should start / rollback / release', async t => {
  t.plan(4)

  const fastify = Fastify()

  const obj = {
    isTransactionActive: false,
    isReleased: false
  }

  const queryRunner = {}
  Object.defineProperties(queryRunner, {
    startTransaction: {
      get: () => () => {
        obj.isTransactionActive = true
        t.pass()
      }
    },
    commitTransaction: {
      get: () => t.fail
    },
    rollbackTransaction: {
      get: () => () => {
        obj.isTransactionActive = false
        obj.isReleased = true
        t.pass()
      }
    },
    release: {
      get: () => t.pass
    },
    isReleased: {
      get: () => obj.isReleased
    },
    isTransactionActive: {
      get: () => obj.isTransactionActive
    }
  })

  fastify.register(fastifyTypeORMQueryRunner, {
    dataSource: {
      createQueryRunner: () => queryRunner
    },
    transaction: true
  })

  fastify.get('/', (req, reply) => {
    t.truthy(req.queryRunner)
    throw new Error('test')
  })

  await fastify.inject({
    method: 'GET',
    url: '/'
  })
})
