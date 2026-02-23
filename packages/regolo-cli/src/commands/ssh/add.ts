import {Flags} from '@oclif/core'
import * as fs from 'node:fs'

import {BaseCommand} from '../../base-command.js'

export default class SshAdd extends BaseCommand {
  static override description = 'Add an SSH public key to your account'
  static override examples = [
    '<%= config.bin %> <%= command.id %> --title "My Key" --key "ssh-rsa AAAA..."',
    '<%= config.bin %> <%= command.id %> --title "My Key" --keyFile ~/.ssh/id_rsa.pub',
  ]
  static override flags = {
    key: Flags.string({description: 'SSH public key content'}),
    keyFile: Flags.string({description: 'Path to SSH public key file'}),
    title: Flags.string({description: 'Title for the SSH key', required: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SshAdd)
    const {keyFile, title} = flags

    if (flags.key && keyFile) {
      this.error('Specify either --key or --keyFile, not both')
    }

    let key: string
    if (keyFile) {
      if (!fs.existsSync(keyFile)) {
        this.error(`File not found: ${keyFile}`)
      }

      key = fs.readFileSync(keyFile, 'utf8').trim()
    } else if (flags.key) {
      key = flags.key
    } else {
      this.error('Provide either --key or --keyFile')
    }

    const result = await this.client.addSshKey(title, key)
    this.log(`SSH key '${title}' added successfully!`)
    const r = result as {fingerprint?: string}
    if (r?.fingerprint) {
      this.log(`Fingerprint: ${r.fingerprint}`)
    }
  }
}
