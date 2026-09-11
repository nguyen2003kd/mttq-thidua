import axios from 'axios'
import { defineConfig } from 'orval'
import baseConfig from './src/configs/base'

const orvalConfig = async () => {
  const { backendDomain, frontendDomain } = baseConfig

  const [caseSmeqBESwagger] = await Promise.all([
    axios.get(`${backendDomain}/swagger/v1/swagger.json`, {
      headers: { Origin: frontendDomain }
    })
  ])

  return defineConfig({
    'mttq': {
      output: {
        mode: 'tags',
        target: 'src/api/endpoints',
        schemas: 'src/api/models',
        client: 'react-query',
        httpClient: 'axios',
        override: {
          query: {
            // Do not force a hook type here. Orval's defaults map GET to
            // useQuery and POST/PUT/PATCH/DELETE to useMutation.
            useInfinite: false 
          },
          mutator: {
            path: 'src/api/mutator/custom-instance.ts',
            name: 'mainInstance'
          },
          header: () => '/* eslint-disable */\r\n',
          operations: {
            AuthController_login: {
              query: {
                useQuery: false,
                useMutation: true
              }
            },
            AuthController_register: {
              query: {
                useQuery: false,
                useMutation: true
              }
            },
            getPosts: {
              query: {
                useInfinite: true,
                useInfiniteQueryParam: 'page'
              }
            },
            postSystemBackup: {
              mutator: {
                path: 'src/api/mutator/fetch-instance.ts',
                name: 'fetchInstance'
              }
            }
          }
        }
      },
      input: {
        target: caseSmeqBESwagger.data,
        filters: {
          tags: ['Authentication', /(((Library)|(Module)) - )?/]
        }
      }
    }
  })
}

export default orvalConfig
