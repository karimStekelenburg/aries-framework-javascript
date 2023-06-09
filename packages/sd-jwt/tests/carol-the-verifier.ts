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
    'Carol SD-JWT Verifier Agent',
    {
      logger: new ConsoleLogger(LogLevel.off),
    },
    modules
  )

  const agent = new Agent(agentOptions)
  await agent.initialize()

  console.log('=== 🚀 Carol the Verifier ===')
  console.log('Reading disclosed SD-JWT')
  const disclosedSdJwt = fs.readFileSync(path.join(__dirname, 'temp-files', 'disclosed-sd-jwt.jwt'), 'utf-8')
  console.log(disclosedSdJwt)
  console.log()

  const verified = await agent.modules.sdJwtModule.verifySdJwt(disclosedSdJwt)

  console.log('Verified:', verified)

  console.log('=== ✅ Carol the Verifier ===')
}

void run()
