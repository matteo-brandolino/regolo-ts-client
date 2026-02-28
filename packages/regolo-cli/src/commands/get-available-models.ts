import {Flags} from '@oclif/core'
import {AvailableModelInfo, RegoloClient} from '@regolo/sdk'

import {BaseCommand} from '../base-command.js'

export default class ModelsAvailable extends BaseCommand {
  static override description = 'Gets available models'
  static override examples = [
    '<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY',
    '<%= config.bin %> <%= command.id %> --apiKey YOUR_KEY --modelType chat',
  ]
  static override flags = {
    apiKey: Flags.string({
      aliases: ['api-key'],
      description: 'The API key used to query Regolo.',
      required: true,
    }),
    modelType: Flags.string({
      aliases: ['model-type'],
      default: '',
      description: 'The type of the models you want to retrieve (returns all by default)',
      options: ['', 'audio_transcription', 'chat', 'embedding', 'image_generation', 'rerank'],
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ModelsAvailable)
    const {apiKey, modelType = ''} = flags

    const availableModels = await RegoloClient.getAvailableModels(apiKey, { modelInfo: true }) as AvailableModelInfo[]
    const outputModels: [string, string][] = []

    for (const model of availableModels) {
      if (model.model_info.mode.includes(modelType)) {
        outputModels.push([model.model_name, model.model_info.mode])
      }
    }

    this.log(JSON.stringify(outputModels, null, 2))
  }
}
