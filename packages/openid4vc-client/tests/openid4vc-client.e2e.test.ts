import { Agent, KeyDidCreateOptions, KeyType, LogLevel } from "@aries-framework/core";
import { OpenId4VcClientModule } from "@aries-framework/openid4vc-client";
import { getAgentOptions } from "../../core/tests/helpers";
import { FancyLogger } from '../../core/src/logger/FancyLogger'
import { ok } from "assert/strict";



const agentOptions = getAgentOptions('OpenId4VcClient Agent', {
    logger: new FancyLogger(LogLevel.debug),
}, {
    openId4VcClient: new OpenId4VcClientModule()
})

describe('OpenId4VcClient', () => {

    let agent: Agent<{
        openId4VcClient: OpenId4VcClientModule
    }>

    beforeEach(async () => {
        agent = new Agent(agentOptions)
        await agent.initialize()
    })


    it('Test', async () => {

        // const issuerUri = 'openid-initiate-issuance://?issuer=https://localhost:3001&credential_type=AcademicAward&pre-authorized_code=igAGg3cz1t5XrNA5uTpCdsRRwzC6ggN2zaGvlUjn6UC'
        const issuerUri = 'openid-initiate-issuance://?issuer=https://68f94666-7538-4c34-91c6-cb2af8384616.mock.pstmn.io&credential_type=OpenBadgeCredential&pre-authorized_code=hTcG9E_-cvSBRhQDxEfyPeAoVxRjXd5RFOeaMX4x0ng'
        const did = await agent.dids.create<KeyDidCreateOptions>({
            method: 'key',
            options: {
                keyType: KeyType.Ed25519,
            },
            secret: {
                seed: '96213c3d7fc8d4d6754c7a0fd969598e',
            },
        })

        await agent.modules.openId4VcClient.preAuthorized({
            issuerUri,
            did: did.didState.did!
        })

    })

})