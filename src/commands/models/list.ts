import {Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'

export default class ModelsList extends BaseCommand {
  static override description = 'List all registered models'
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
    const {flags} = await this.parse(ModelsList)
    const result = await this.client.getModels()
    const models = result.models ?? []

    if (models.length === 0) {
      this.log('No models found')
      return
    }

    if (flags.format === 'json') {
      this.log(JSON.stringify(models, null, 2))
      return
    }

    this.log(`\nFound ${result.total ?? models.length} models:\n`)
    for (const model of models) {
      this.log(`  • ${model.name} (${model.provider})`)
      if ((model as {url?: string}).url) {
        this.log(`    URL: ${(model as {url?: string}).url}`)
      }

      this.log(`    Created: ${(model as {created_at?: string}).created_at}`)
      this.log('')
    }
  }
}
