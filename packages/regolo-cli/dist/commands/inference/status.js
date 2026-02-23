import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
export default class InferenceStatus extends BaseCommand {
    static description = 'Show currently loaded models for inference';
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
        const { flags } = await this.parse(InferenceStatus);
        const result = await this.client.getLoadedModels();
        const { loaded_models: loadedModels, total } = result;
        if (flags.format === 'json') {
            this.log(JSON.stringify(result, null, 2));
            return;
        }
        if (loadedModels.length === 0) {
            this.log('No models currently loaded for inference');
            return;
        }
        this.log(`\nCurrently loaded models (${total}):\n`);
        for (const model of loadedModels) {
            this.log(`  • ${model.model_name ?? 'N/A'} (Session ${model.session_id ?? 'N/A'})`);
            this.log(`    GPU: ${model.gpu_id ?? 'N/A'}`);
            this.log(`    Loaded: ${model.load_time ?? 'N/A'}`);
            this.log(`    Cost: ${model.cost ?? 'N/A'}`);
            this.log('');
        }
    }
}
