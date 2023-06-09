import { AskarModule } from '@aries-framework/askar'
import { Agent, ConsoleLogger, LogLevel } from '@aries-framework/core'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import fs from 'fs'
import path from 'path'

import { getAgentOptions } from '../../core/tests/helpers'
import { SdJwtModule } from '../src/SdJwtModule'

const run = async () => {
  const modules = {
    askar: new AskarModule({ ariesAskar }),
    sdJwtModule: new SdJwtModule(),
  }

  const agentOptions = getAgentOptions(
    'Bob SD-JWT Holder Agent',
    {
      logger: new ConsoleLogger(LogLevel.off),
    },
    modules
  )

  const agent = new Agent(agentOptions)
  await agent.initialize()

  const disclosedValues = ['name']
  console.log('=== 🚀 Bob the Holder ===')
  console.log('Reading undisclosed SD-JWT')
  const sdJwt = fs.readFileSync(path.join(__dirname, 'temp-files', 'sd-jwt.jwt'), 'utf-8')
  console.log(sdJwt)
  console.log()
  console.log('Disclosing claims')
  console.log(disclosedValues)
  console.log()
  const disclosedSdJwt = await agent.modules.sdJwtModule.discloseClaims(sdJwt, disclosedValues)
  console.log('Writing disclosed SD-JWT')
  console.log(disclosedSdJwt)
  console.log()
  fs.writeFileSync(path.join(__dirname, 'temp-files', 'disclosed-sd-jwt.jwt'), disclosedSdJwt)
  console.log('=== ✅ Bob the Holder ===')
}

void run()
