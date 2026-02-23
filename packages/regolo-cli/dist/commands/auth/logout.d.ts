import { BaseCommand } from '../../base-command.js';
export default class AuthLogout extends BaseCommand {
    static description: string;
    run(): Promise<void>;
}
