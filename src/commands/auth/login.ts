import {input, password} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'

export default class AuthLogin extends BaseCommand {
  static override description = 'Authenticate with the Regolo API'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --username myuser --password mypassword',
  ]
  static override flags = {
    password: Flags.string({char: 'p', description: 'Password for authentication'}),
    username: Flags.string({char: 'u', description: 'Username for authentication'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogin)
    let username = flags?.username
    let pwd = flags?.password

    if (!username) {
      username = await input({message: 'Enter your username'})
    }

    if (!pwd) {
      pwd = await password({message: 'Enter your password'})
    }

    await this.client.authenticate(username, pwd)
  }
}
