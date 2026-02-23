import {BaseCommand} from '../../base-command.js'

export default class AuthLogout extends BaseCommand {
  static override description = 'Logout and clear saved tokens'

  public async run(): Promise<void> {
    this.client.logout()
  }
}
