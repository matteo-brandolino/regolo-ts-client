import { Flags } from '@oclif/core';
import * as fs from 'node:fs';
import { BaseCommand } from '../../base-command.js';
export default class SshAdd extends BaseCommand {
    static description = 'Add an SSH public key to your account';
    static examples = [
        '<%= config.bin %> <%= command.id %> --title "My Key" --key "ssh-rsa AAAA..."',
        '<%= config.bin %> <%= command.id %> --title "My Key" --keyFile ~/.ssh/id_rsa.pub',
    ];
    static flags = {
        key: Flags.string({ description: 'SSH public key content' }),
        keyFile: Flags.string({ description: 'Path to SSH public key file' }),
        title: Flags.string({ description: 'Title for the SSH key', required: true }),
    };
    async run() {
        const { flags } = await this.parse(SshAdd);
        const { keyFile, title } = flags;
        if (flags.key && keyFile) {
            this.error('Specify either --key or --keyFile, not both');
        }
        let key;
        if (keyFile) {
            if (!fs.existsSync(keyFile)) {
                this.error(`File not found: ${keyFile}`);
            }
            key = fs.readFileSync(keyFile, 'utf8').trim();
        }
        else if (flags.key) {
            key = flags.key;
        }
        else {
            this.error('Provide either --key or --keyFile');
        }
        const result = await this.client.addSshKey(title, key);
        this.log(`SSH key '${title}' added successfully!`);
        const r = result;
        if (r?.fingerprint) {
            this.log(`Fingerprint: ${r.fingerprint}`);
        }
    }
}
