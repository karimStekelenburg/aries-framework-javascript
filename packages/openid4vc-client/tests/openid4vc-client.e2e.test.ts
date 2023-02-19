import type { KeyDidCreateOptions } from '@aries-framework/core'

import { Agent, KeyType, W3cCredentialRecord, W3cVcModule, TypedArrayEncoder } from '@aries-framework/core'
import nock, { cleanAll, enableNetConnect } from 'nock'

import { didKeyToInstanceOfKey } from '../../core/src/modules/dids/helpers'
import { customDocumentLoader } from '../../core/src/modules/vc/__tests__/documentLoader'
import { getAgentOptions } from '../../core/tests/helpers'

import { OpenId4VcClientModule } from '@aries-framework/openid4vc-client'

import { acquireAccessTokenResponse, credentialRequestResponse, getMetadataResponse } from './fixtures'

describe('OpenId4VcClient', () => {
  let agent: Agent<{
    openId4VcClient: OpenId4VcClientModule
    w3cVc: W3cVcModule
  }>

  beforeEach(async () => {
    const agentOptions = getAgentOptions(
      'OpenId4VcClient Agent',
      {},
      {
        openId4VcClient: new OpenId4VcClientModule(),
        w3cVc: new W3cVcModule({
          documentLoader: customDocumentLoader,
        }),
      }
    )

    agent = new Agent(agentOptions)
    await agent.initialize()
  })

  afterEach(async () => {
    await agent.shutdown()
    await agent.wallet.delete()
  })

  describe('Pre-authorized flow', () => {
    const issuerUri =
      'openid-initiate-issuance://?issuer=https://launchpad.mattrlabs.com&credential_type=OpenBadgeCredential&pre-authorized_code=krBcsBIlye2T-G4-rHHnRZUCah9uzDKwohJK6ABNvL-'
    beforeAll(async () => {
      /**
       *  Below we're setting up some mock HTTP responses.
       *  These responses are based on the openid-initiate-issuance URI above
       * */

      // setup temporary redirect mock
      nock('https://launchpad.mattrlabs.com').get('/.well-known/openid-credential-issuer').reply(307, undefined, {
        Location: 'https://launchpad.vii.electron.mattrlabs.io/.well-known/openid-credential-issuer',
      })

      // setup server metadata response
      const httpMock = nock('https://launchpad.vii.electron.mattrlabs.io')
        .get('/.well-known/openid-credential-issuer')
        .reply(200, getMetadataResponse)

      // setup access token response
      httpMock.post('/oidc/v1/auth/token').reply(200, acquireAccessTokenResponse)

      // setup credential request response
      httpMock.post('/oidc/v1/auth/credential').reply(200, credentialRequestResponse)
    })

    afterAll(async () => {
      cleanAll()
      enableNetConnect()
    })

    it('Should successfully execute the pre-authorized flow', async () => {
      const did = await agent.dids.create<KeyDidCreateOptions>({
        method: 'key',
        options: {
          keyType: KeyType.Ed25519,
        },
        secret: {
          privateKey: TypedArrayEncoder.fromString('96213c3d7fc8d4d6754c7a0fd969598e'),
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const keyInstance = didKeyToInstanceOfKey(did.didState.did!)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const kid = `${did.didState.did!}#${keyInstance.fingerprint}`

      const w3cCredentialRecord = await agent.modules.openId4VcClient.requestCredentialPreAuthorized({
        issuerUri,
        kid,
        checkRevocationState: false,
      })

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
  describe('Authorization flow', () => {
    beforeAll(async () => {
      /**
       *  Below we're setting up some mock HTTP responses.
       *  These responses are based on the openid-initiate-issuance URI above
       * */

      // setup temporary redirect mock
      nock('https://launchpad.mattrlabs.com').get('/.well-known/openid-credential-issuer').reply(307, undefined, {
        Location: 'https://launchpad.vii.electron.mattrlabs.io/.well-known/openid-credential-issuer',
      })

      // setup server metadata response
      const httpMock = nock('https://launchpad.vii.electron.mattrlabs.io')
        .get('/.well-known/openid-credential-issuer')
        .reply(200, getMetadataResponse)

      // setup access token response
      httpMock.post('/oidc/v1/auth/token').reply(200, aquireAccessTokenResponse)

      // setup credential request response
      httpMock.post('/oidc/v1/auth/credential').reply(200, credentialRequestResponse)
    })

    afterAll(async () => {
      cleanAll()
      enableNetConnect()
    })

    it('should generate a correct code verifier', async () => {
      const codeVerifier = await agent.modules.openId4VcClient.generateCodeVerifier()

      expect(typeof codeVerifier).toBe('string')

      // length restrictions are specified here https://www.rfc-editor.org/rfc/rfc7636#section-4.1
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43)
      expect(codeVerifier.length).toBeLessThanOrEqual(128)
    })

    it('should generate a valid authorization url', async () => {
      const clientId = 'test-client'
      const codeVerifier = await agent.modules.openId4VcClient.generateCodeVerifier()
      const redirectUri = 'https://example.com/cb'
      const scope = ['TestCredential']
      const initiationUri =
        'openid-initiate-issuance://?issuer=https://launchpad.mattrlabs.com&credential_type=OpenBadgeCredential'
      const authUrl = await agent.modules.openId4VcClient.generateAuthorizationUrl({
        clientId,
        codeVerifier,
        redirectUri,
        scope,
        initiationUri,
      })

      const parsedUrl = new URL(authUrl)
      expect(authUrl.startsWith('https://launchpad.vii.electron.mattrlabs.io/oidc/v1/auth/authorize')).toBe(true)
      expect(parsedUrl.searchParams.get('response_type')).toBe('code')
      expect(parsedUrl.searchParams.get('client_id')).toBe(clientId)
      expect(parsedUrl.searchParams.get('code_challenge_method')).toBe('S256')
      expect(parsedUrl.searchParams.get('redirect_uri')).toBe(redirectUri)
    })
    it('should throw if no scope is provided', async () => {
      // setup temporary redirect mock
      nock('https://launchpad.mattrlabs.com').get('/.well-known/openid-credential-issuer').reply(307, undefined, {
        Location: 'https://launchpad.vii.electron.mattrlabs.io/.well-known/openid-credential-issuer',
      })

      // setup server metadata response
      nock('https://launchpad.vii.electron.mattrlabs.io')
        .get('/.well-known/openid-credential-issuer')
        .reply(200, getMetadataResponse)

      const clientId = 'test-client'
      const codeVerifier = await agent.modules.openId4VcClient.generateCodeVerifier()
      const redirectUri = 'https://example.com/cb'
      const initiationUri =
        'openid-initiate-issuance://?issuer=https://launchpad.mattrlabs.com&credential_type=OpenBadgeCredential'
      expect(
        agent.modules.openId4VcClient.generateAuthorizationUrl({
          clientId,
          codeVerifier,
          redirectUri,
          scope: [],
          initiationUri,
        })
      ).rejects.toThrow()
    })
    it('should successfully execute request a credential', async () => {
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

      const clientId = 'test-client'
      const codeVerifier = await agent.modules.openId4VcClient.generateCodeVerifier()
      const redirectUri = 'https://example.com/cb'
      const initiationUri =
        'openid-initiate-issuance://?issuer=https://launchpad.mattrlabs.com&credential_type=OpenBadgeCredential'

      const w3cCredentialRecord = await agent.modules.openId4VcClient.requestCredential({
        clientId: clientId,
        code: 'test-code',
        codeVerifier: codeVerifier,
        checkRevocationState: false,
        kid: kid,
        issuerUri: initiationUri,
        redirectUri: redirectUri,
      })

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
})
