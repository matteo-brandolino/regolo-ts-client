import { confirm } from '@inquirer/prompts';
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
export default class SshDelete extends BaseCommand {
    static args = {
        key_id: Args.string({ description: 'ID of the SSH key to delete', required: true }),
    };
    static description = 'Delete an SSH key from your account';
    static examples = [
        '<%= config.bin %> <%= command.id %> <key_id>',
        '<%= config.bin %> <%= command.id %> <key_id> --confirm',
    ];
    static flags = {
        confirm: Flags.boolean({ description: 'Skip confirmation prompt' }),
    };
    async run() {
        const { args, flags } = await this.parse(SshDelete);
        const { key_id: keyId } = args;
        if (!flags.confirm) {
            const ok = await confirm({ message: `Are you sure you want to delete SSH key '${keyId}'? (y/n)` });
            if (!ok) {
                this.log('Deletion cancelled');
                return;
            }
        }
        await this.client.deleteSshKey(keyId);
        this.log(`SSH key '${keyId}' deleted successfully!`);
    }
}
