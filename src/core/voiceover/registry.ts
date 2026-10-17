import { VoiceoverProvider, VoiceoverProviderId } from './types';
import { EdgeTTSVoiceoverProvider } from './providers/edge-tts.provider';
import { EspeakVoiceoverProvider } from './providers/espeak.provider';

export class VoiceoverProviderRegistry {
  private providers = new Map<VoiceoverProviderId, VoiceoverProvider>();
  private defaultProviderId: VoiceoverProviderId = 'edge-tts';

  constructor() {
    this.register(new EdgeTTSVoiceoverProvider());
    this.register(new EspeakVoiceoverProvider());
  }

  register(provider: VoiceoverProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id?: VoiceoverProviderId): VoiceoverProvider {
    const targetId = id || this.defaultProviderId;
    const provider = this.providers.get(targetId);
    if (!provider) {
      throw new Error(
        `Voiceover provider "${targetId}" is not registered. Available providers: ${Array.from(
          this.providers.keys()
        ).join(', ')}`
      );
    }
    return provider;
  }

  setDefaultProvider(id: VoiceoverProviderId): void {
    if (!this.providers.has(id)) {
      throw new Error(`Cannot set unregistered provider "${id}" as default.`);
    }
    this.defaultProviderId = id;
  }

  getDefaultProviderId(): VoiceoverProviderId {
    return this.defaultProviderId;
  }

  list(): VoiceoverProviderId[] {
    return Array.from(this.providers.keys());
  }
}

export const defaultVoiceoverRegistry = new VoiceoverProviderRegistry();
