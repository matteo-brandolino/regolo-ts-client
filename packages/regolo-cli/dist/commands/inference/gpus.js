import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
export default class InferenceGpus extends BaseCommand {
    static description = 'List available GPUs for inference';
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
        const { flags } = await this.parse(InferenceGpus);
        const result = await this.client.getAvailableGpus();
        const { gpus, total } = result;
        if (gpus.length === 0) {
            this.log('No GPUs available');
            return;
        }
        if (flags.format === 'json') {
            this.log(JSON.stringify(result, null, 2));
            return;
        }
        this.log(`\nAvailable GPUs (${total}):\n`);
        for (const gpu of gpus) {
            this.log(`  • ${gpu.InstanceType}`);
            this.log(`    Model: ${gpu.GpuModel}`);
            this.log(`    Count: ${gpu.GpuCount}`);
            this.log(`    Memory: ${gpu.MemoryGiB} GiB`);
            this.log(`    Price: €${gpu.PriceEUR}`);
            this.log(`    Region: ${gpu.Region}`);
            this.log('');
        }
    }
}
