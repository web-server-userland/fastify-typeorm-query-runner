'use strict'

const fp = require('fastify-plugin')

const defaultOptions = {
  transaction: false,
  dataSource: null,
  match: () => true,
  respIsError: () => false
}

function fastifyTypeORMQueryRunner (fastify, opts, done) {
  fastify.decorateRequest('queryRunner', null)

  if (!opts.dataSource) {
    return done(new Error('dataSource is required'))
  }

  if (!('createQueryRunner' in opts.dataSource)) {
    return done(new Error('dataSource.createQueryRunner is not required'))
  }

  const options = Object.assign({}, defaultOptions, opts)

  fastify.addHook('onRequest', async (request) => {
    if (!options.match(request)) {
      return
    }

    request.queryRunner = options.dataSource.createQueryRunner()

    if (options.transaction) {
      await request.queryRunner.startTransaction()
    }
  })

  fastify.addHook('onSend', async (request, _reply, payload) => {
    if (!options.match(request)) {
      return
    }

    if (request.queryRunner.isReleased) {
      return
    }

    if (options.transaction && request.queryRunner.isTransactionActive) {
      options.respIsError(payload) ? await request.queryRunner.rollbackTransaction() : await request.queryRunner.commitTransaction()
    }

    await request.queryRunner.release()
  })

  fastify.addHook('onError', async (request) => {
    if (!options.match(request)) {
      return
    }

    if (request.queryRunner.isReleased) {
      return
    }

    if (options.transaction && request.queryRunner.isTransactionActive) {
      await request.queryRunner.rollbackTransaction()
    }

    await request.queryRunner.release()
  })

  done()
}

module.exports = fp(fastifyTypeORMQueryRunner, {
  fastify: '4.x',
  name: '@web-server-userland/fastify-typeorm-query-runner'
})
