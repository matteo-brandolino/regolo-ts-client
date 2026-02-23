import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
export default class ModelsRegister extends BaseCommand {
    static description = 'Register a new model in the system';
    static examples = [
        '<%= config.bin %> <%= command.id %> --name mymodel --type huggingface --url https://huggingface.co/...',
        '<%= config.bin %> <%= command.id %> --name mymodel --type custom',
    ];
    static flags = {
        apiKey: Flags.string({ description: 'HuggingFace API key (optional, for private models)' }),
        name: Flags.string({ char: 'n', description: 'Name for the model' }),
        type: Flags.string({
            char: 't',
            description: 'Type of model provider',
            options: ['huggingface', 'ollama', 'custom'],
        }),
        url: Flags.string({ description: 'Model URL (required for huggingface models)' }),
    };
    async run() {
        const { flags } = await this.parse(ModelsRegister);
        const { apiKey, name, type, url } = flags;
        if (type === 'huggingface' && !url) {
            this.error('❌ URL is required for HuggingFace models');
        }
        if (!name)
            this.error('❌ A name model is required');
        if (!type)
            this.error('❌ A type model is required');
        await this.client.registerModel(name, type, url, apiKey);
        this.log(`Model '${name}' registered successfully!`);
        if (type === 'huggingface') {
            this.log('HuggingFace model added to your regolo account!');
        }
        else if (type === 'custom') {
            this.log('Custom project created. You can now upload your model files using SSH.');
        }
    }
}
