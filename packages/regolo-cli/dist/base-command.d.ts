import { Command } from '@oclif/core';
import { ModelManagementClient } from './client/model-management-client.js';
export declare abstract class BaseCommand extends Command {
    protected client: ModelManagementClient;
}
