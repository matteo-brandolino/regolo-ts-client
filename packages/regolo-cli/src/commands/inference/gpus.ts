import {Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'

type Gpu = {
  CpuCount: number
  GpuCount: number
  GpuModel: string
  InstanceType: string
  MemoryGiB: number
  PriceEUR: number
  Region: string
}

type GpusResponse = {gpus: Gpu[]; total: number}

export default class InferenceGpus extends BaseCommand {
  static override description = 'List available GPUs for inference'
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
    const {flags} = await this.parse(InferenceGpus)
    const result = await this.client.getAvailableGpus()
    const {gpus, total} = result as GpusResponse

    if (gpus.length === 0) {
      this.log('No GPUs available')
      return
    }

    if (flags.format === 'json') {
      this.log(JSON.stringify(result, null, 2))
      return
    }

    this.log(`\nAvailable GPUs (${total}):\n`)
    for (const gpu of gpus) {
      this.log(`  • ${gpu.InstanceType}`)
      this.log(`    Model: ${gpu.GpuModel}`)
      this.log(`    Count: ${gpu.GpuCount}`)
      this.log(`    Memory: ${gpu.MemoryGiB} GiB`)
      this.log(`    Price: €${gpu.PriceEUR}`)
      this.log(`    Region: ${gpu.Region}`)
      this.log('')
    }
  }
}
