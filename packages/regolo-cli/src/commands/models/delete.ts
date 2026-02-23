import {confirm} from '@inquirer/prompts'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'

export default class ModelsDelete extends BaseCommand {
  static override args = {
    modelName: Args.string({description: 'Name of the model to delete', required: true}),
  }
  static override description = 'Delete a model'
  static override examples = [
    '<%= config.bin %> <%= command.id %> mymodel',
    '<%= config.bin %> <%= command.id %> mymodel --confirm',
  ]
  static override flags = {
    confirm: Flags.boolean({description: 'Skip confirmation prompt'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ModelsDelete)
    const {modelName} = args

    if (!flags.confirm) {
      const ok = await confirm({message: `Are you sure you want to delete model '${modelName}'? (y/n)`})
      if (!ok) {
        this.log('Deletion cancelled')
        return
      }
    }

    await this.client.deleteModel(modelName)
    this.log(`Model '${modelName}' deleted successfully!`)
  }
}
