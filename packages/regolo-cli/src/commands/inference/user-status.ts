import {Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'

export default class InferenceUserStatus extends BaseCommand {
  static override description = 'Show inference usage status for your account'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --month 012025',
    '<%= config.bin %> <%= command.id %> --timeRangeStart 2025-01-01T00:00:00Z --timeRangeEnd 2025-01-31T23:59:59Z',
  ]
  static override flags = {
    format: Flags.string({
      char: 'f',
      default: 'table',
      description: 'Output format',
      options: ['table', 'json'],
    }),
    month: Flags.string({description: 'Month in MMYYYY format (e.g. 012025)'}),
    timeRangeEnd: Flags.string({description: 'End of time range (ISO 8601)'}),
    timeRangeStart: Flags.string({description: 'Start of time range (ISO 8601)'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InferenceUserStatus)
    const {month, timeRangeEnd, timeRangeStart} = flags

    if (month && !/^(0[1-9]|1[0-2])\d{4}$/.test(month)) {
      this.error('--month must be in MMYYYY format (e.g. 012025)')
    }

    const result = await this.client.getUserInferenceStatus(month, timeRangeStart, timeRangeEnd)
    if (flags.format !== 'json') {
      this.log(
        month
          ? `\nYour Inference Status for         
  ${month}:\n`
          : '\nYour Currently Running Models:\n',
      )
    }

    this.log(JSON.stringify(result, null, 2))
  }
}
