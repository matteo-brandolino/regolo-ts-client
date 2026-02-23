import { Command } from '@oclif/core';
import { ModelManagementClient } from './client/model-management-client.js';
export class BaseCommand extends Command {
    client = new ModelManagementClient();
}
