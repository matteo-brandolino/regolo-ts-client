import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
export default class ModelsList extends BaseCommand {
    static description = 'List all registered models';
    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --format json',
    ];
    static flags = {
        format: Flags.string({
            char: 'f',
            default: 'table',
            description: 'Output format',
            options: ['table', 'json'],
        }),
    };
    async run() {
        const { flags } = await this.parse(ModelsList);
        const result = await this.client.getModels();
        const models = result.models ?? [];
        if (models.length === 0) {
            this.log('No models found');
            return;
        }
        if (flags.format === 'json') {
            this.log(JSON.stringify(models, null, 2));
            return;
        }
        this.log(`\nFound ${result.total ?? models.length} models:\n`);
        for (const model of models) {
            this.log(`  • ${model.name} (${model.provider})`);
            if (model.url) {
                this.log(`    URL: ${model.url}`);
            }
            this.log(`    Created: ${model.created_at}`);
            this.log('');
        }
    }
}
