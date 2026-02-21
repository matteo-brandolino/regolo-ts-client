import {Command} from '@oclif/core'

import {ModelManagementClient} from './models/model-management-client.js'

export abstract class BaseCommand extends Command {
  protected client = new ModelManagementClient()
}
