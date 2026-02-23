import { BaseCommand } from '../../base-command.js';
export default class AuthLogin extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        password: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        username: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<void>;
}
