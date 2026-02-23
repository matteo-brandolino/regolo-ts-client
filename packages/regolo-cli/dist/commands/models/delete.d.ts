import { BaseCommand } from '../../base-command.js';
export default class ModelsDelete extends BaseCommand {
    static args: {
        modelName: import("@oclif/core/interfaces").Arg<string, Record<string, unknown>>;
    };
    static description: string;
    static examples: string[];
    static flags: {
        confirm: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
