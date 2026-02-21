import {Command} from '@oclif/core'

import {ModelManagementClient} from './client/model-management-client.js'

export abstract class BaseCommand extends Command {
  protected client = new ModelManagementClient()
}
