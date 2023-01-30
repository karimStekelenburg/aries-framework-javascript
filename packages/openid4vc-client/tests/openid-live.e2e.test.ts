import type { KeyDidCreateOptions } from '@aries-framework/core'

import { Agent, KeyType, LogLevel, W3cCredentialRecord } from '@aries-framework/core'
import fetch from 'node-fetch'

import { didKeyToInstanceOfKey } from '../../core/src/modules/dids/helpers'
import { getAgentOptions } from '../../core/tests/helpers'
import { TestLogger } from '../../core/tests/logger'

import { OpenId4VcClientModule } from '@aries-framework/openid4vc-client'

const fetchIssuerUri = async () => {
  const url = 'https://launchpad.mattrlabs.com/api/credential-offer'

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'OpenBadgeCredential',
      userId: '622a9f65-21c0-4c0b-9a6a-f7574c2a1549',
      userAuthenticationRequired: false,
    }),
  })

  const responseJson = await response.json()
  return responseJson.offerUrl
}

const fetchIssuerUriAuthorized = async () => {
  const url = 'https://launchpad.mattrlabs.com/api/credential-offer'

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'OpenBadgeCredential', userId: 'default', userAuthenticationRequired: true }),
  })

  const responseJson = await response.json()
  return responseJson.offerUrl
}


const testAuthRequest = async () => {
  const url = 'https://launchpad.vii.electron.mattrlabs.io/oidc/v1/auth/authorize'

  const authorization_details = [{ "type": "openid_credential", "format": "ldp_vc", "types": ["VerifiableCredential", "OpenBadgeCredential"] }]


  const details = {
    response_type: "code",
    client_id: "test-client",
    code_challenge: "043A718774C572BD8A25ADBEB1BFCD5C0256AE11CECF9F9C3F925D0E52BEAF89",
    code_challenge_method: "S256",
    authorization_details: JSON.stringify(authorization_details),
    redirect_uri: "https://example.com"
  }

  let formBody = [];
  for (let property in details) {
    let encodedKey = encodeURIComponent(property);
    // @ts-ignore
    let encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  // @ts-ignore
  formBody = formBody.join("&");


  const result = await fetch(`${url}?${formBody}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    // @ts-ignore
    // body: formBody
  })

  console.log(result)
  console.log(JSON.stringify(result, null, 2))
}



describe('OpenId4VcClient', () => {
  let agent: Agent<{
    openId4VcClient: OpenId4VcClientModule
  }>

  beforeEach(async () => {
    const agentOptions = getAgentOptions(
      'OpenId4VcClient Agent',
      {
        logger: new TestLogger(LogLevel.test),
      },
      {
        openId4VcClient: new OpenId4VcClientModule(),
      }
    )

    agent = new Agent(agentOptions)
    await agent.initialize()
  })

  afterEach(async () => {
    await agent.shutdown()
    await agent.wallet.delete()
  })

  xdescribe('Pre-authorized flow', () => {
    it('Should successfully execute the pre-authorized flow', async () => {
      const issuerUri = await fetchIssuerUri()
      const did = await agent.dids.create<KeyDidCreateOptions>({
        method: 'key',
        options: {
          keyType: KeyType.Ed25519,
        },
        secret: {
          seed: '96213c3d7fc8d4d6754c7a0fd969598e',
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const keyInstance = didKeyToInstanceOfKey(did.didState.did!)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const kid = `${did.didState.did!}#${keyInstance.fingerprint}`

      const w3cCredentialRecord = await agent.modules.openId4VcClient.preAuthorized(
        {
          issuerUri,
          kid,
        },
        false
      )

      expect(w3cCredentialRecord).toBeInstanceOf(W3cCredentialRecord)

      expect(w3cCredentialRecord.credential.type).toEqual([
        'VerifiableCredential',
        'VerifiableCredentialExtension',
        'OpenBadgeCredential',
      ])

      // @ts-ignore
      expect(w3cCredentialRecord.credential.credentialSubject.id).toEqual(did.didState.did)
    })
  })

  describe('Authrized flow', () => {
    it('', async () => {
      // const issuerUri = await fetchIssuerUriAuthorized()
      // console.log(issuerUri)

      await testAuthRequest()

    })
  })
})
