import fastify from 'fastify'
import fastifyTypeORMQueryRunner from '..'
import { DataSource } from 'typeorm'

const app = fastify()

app.register(fastifyTypeORMQueryRunner)

app.register(fastifyTypeORMQueryRunner, {
  dataSource: new DataSource({
    type: 'sqlite',
    database: '',
    driver: undefined
  })
})

app.register(fastifyTypeORMQueryRunner, {
  dataSource: new DataSource({
    type: 'sqlite',
    database: '',
    driver: undefined
  }),
  transaction: true,
  match: request => request.routerPath.startsWith('/v2'),
  respIsError: (respStr) => respStr === '{"status":false}'
})
