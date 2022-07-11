/// <reference types="node" />

import { FastifyPluginCallback, FastifyRequest } from 'fastify';
import { DataSource, QueryRunner } from 'typeorm';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * typeorm dataSource queryRunner
     */
    queryRunner: QueryRunner;
  }
}

export interface FastifyTypeORMQueryRunnerOptions {
  /**
   * TypeORM dataSource
   */
  dataSource: DataSource
  /**
   * Whether to bind the life cycle of a thing to a request
   * Receiving requests: opening transaction
   * Return response: close transaction
   * Requesting an error: rolling back transaction
   */
  transaction?: boolean
  /**
   * Only matching requests will enable the plugin
   * @param request {FastifyRequest}
   * @returns {boolean}
   */
  match?: (request: FastifyRequest) => boolean
  /**
   * When the response matches the condition, it is considered an error
   * @param respStr {string}
   * @returns {boolean}
   */
  respIsError?: (respStr: string) => boolean
}

declare const fastifyTypeORMQueryRunner: FastifyPluginCallback<FastifyTypeORMQueryRunnerOptions>;
export default fastifyTypeORMQueryRunner;
