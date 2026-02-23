import { BaseCommand } from '../../base-command.js';
export default class SshDelete extends BaseCommand {
    static args: {
        key_id: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    static description: string;
    static examples: string[];
    static flags: {
        confirm: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
