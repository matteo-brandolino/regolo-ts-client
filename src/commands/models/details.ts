import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'

export default class ModelsDetails extends BaseCommand {
  static override args = {
    model_name: Args.string({description: 'Name of the model', required: true}),
  }
  static override description = 'Get detailed information about a specific model'
  static override examples = [
    '<%= config.bin %> <%= command.id %> mymodel',
    '<%= config.bin %> <%= command.id %> mymodel --format json',
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
    const {args, flags} = await this.parse(ModelsDetails)
    const model = await this.client.getModel(args.model_name)

    if (flags.format === 'json') {
      this.log(JSON.stringify(model, null, 2))
      return
    }

    this.log(`\n Model Details: ${model.name}`)
    this.log(`  Type: ${model.provider}`)
    if (model.email) this.log(`  Email: ${model.email}`)
    if (model.url) this.log(`  URL: ${model.url}`)
    this.log(`  Created: ${model.created_at}`)
  }
}
