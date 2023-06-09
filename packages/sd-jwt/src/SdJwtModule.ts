import type { DependencyManager, FeatureRegistry, Module } from '@aries-framework/core'

import { SdJwtApi } from './SdJwtApi'
import { SdJwtService } from './services'

export class SdJwtModule implements Module {
  public readonly api = SdJwtApi

  /**
   * Registers the dependencies of the question answer module on the dependency manager.
   */
  public register(dependencyManager: DependencyManager) {
    // Api
    dependencyManager.registerContextScoped(SdJwtApi)

    // Services
    dependencyManager.registerSingleton(SdJwtService)
  }
}
