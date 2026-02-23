import { BaseCommand } from '../../base-command.js';
export default class AuthLogout extends BaseCommand {
    static description = 'Logout and clear saved tokens';
    async run() {
        this.client.logout();
    }
}
