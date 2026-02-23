import { BaseCommand } from '../../base-command.js';
export default class InferenceStatus extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        format: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    run(): Promise<void>;
}
