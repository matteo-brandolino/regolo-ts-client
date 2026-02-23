import {Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'

export default class SshList extends BaseCommand {
  static override description = 'List SSH keys in your account'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --format json',
  ]
  static override flags = {
    format: Flags.string({
      char: 'f',
      default: 'table',
      description: 'Output format',
      options: ['table', 'json'],
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SshList)
    const result = await this.client.getSshKeys()
    const keys = (result as {ssh_keys?: unknown[]}).ssh_keys ?? (Array.isArray(result) ? result : [])

    if (keys.length === 0) {
      this.log('No SSH keys found')
      return
    }

    if (flags.format === 'json') {
      this.log(JSON.stringify(result, null, 2))
      return
    }

    this.log(`\nFound ${keys.length} SSH key(s):\n`)
    for (const k of keys) {
      const key = k as {title?: string; id?: string; fingerprint?: string; created_at?: string}
      this.log(`  • ${key.title ?? '(no title)'}`)
      if (key.id) this.log(`    ID: ${key.id}`)
      if (key.fingerprint) this.log(`    Fingerprint: ${key.fingerprint}`)
      if (key.created_at) this.log(`    Created: ${key.created_at}`)
      this.log('')
    }
  }
}
