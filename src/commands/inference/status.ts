import {Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'

type LoadedModel = {
  cost?: string
  gpu_id?: string
  load_time?: string
  model_name?: string
  session_id?: string
}

type LoadedModelsResponse = {loaded_models: LoadedModel[]; total: number}

export default class InferenceStatus extends BaseCommand {
  static override description = 'Show currently loaded models for inference'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --format json',
  ]
  static override flags = {
    format: Flags.string({
      char: 'f',
      default: 'table',
      description: 'Output format',
      options: ['table', 'json'],
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InferenceStatus)
    const result = await this.client.getLoadedModels()
    const {loaded_models: loadedModels, total} = result as LoadedModelsResponse

    if (flags.format === 'json') {
      this.log(JSON.stringify(result, null, 2))
      return
    }

    if (loadedModels.length === 0) {
      this.log('No models currently loaded for inference')
      return
    }

    this.log(`\nCurrently loaded models (${total}):\n`)
    for (const model of loadedModels) {
      this.log(`  • ${model.model_name ?? 'N/A'} (Session ${model.session_id ?? 'N/A'})`)
      this.log(`    GPU: ${model.gpu_id ?? 'N/A'}`)
      this.log(`    Loaded: ${model.load_time ?? 'N/A'}`)
      this.log(`    Cost: ${model.cost ?? 'N/A'}`)
      this.log('')
    }
  }
}
