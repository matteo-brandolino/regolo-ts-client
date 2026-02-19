import {Command} from '@oclif/core'

export default class World2 extends Command {
  static args = {}
  static description = 'Say hello world2'
  static examples = [
    `<%= config.bin %> <%= command.id %>
hello world2! (./src/commands/hello/world.ts)
`,
  ]
  static flags = {}

  async run(): Promise<void> {
    this.log('hello world2! (./src/commands/hello/world.ts)')
  }
}
