import {confirm, select} from '@inquirer/prompts'
import {Args, Flags} from '@oclif/core'
import * as fs from 'node:fs'

import {BaseCommand} from '../base-command.js'

type Gpu = {
  GpuModel: string
  InstanceType: string
}

type GpusResponse = {gpus: Gpu[]; total: number}

export default class Workflow extends BaseCommand {
  static override args = {
    modelName: Args.string({description: 'Name of the model', required: true}),
  }
  static override description =
    'Complete workflow: register model, upload (if custom), and optionally load for inference'
  static override examples = [
    '<%= config.bin %> <%= command.id %> mymodel --type huggingface --url https://huggingface.co/...',
    '<%= config.bin %> <%= command.id %> mymodel --type custom --sshKeyFile ~/.ssh/id_rsa.pub --sshKeyTitle "My Key" --localModelPath ./model',
    '<%= config.bin %> <%= command.id %> mymodel --type custom --autoLoad',
  ]
  static override flags = {
    apiKey: Flags.string({description: 'HuggingFace API key (optional)'}),
    autoLoad: Flags.boolean({description: 'Automatically load model for inference after upload'}),
    localModelPath: Flags.string({description: 'Path to local model files (for custom models)'}),
    sshKeyFile: Flags.string({description: 'Path to SSH public key file (for custom models)'}),
    sshKeyTitle: Flags.string({description: 'Title for SSH key (for custom models)'}),
    type: Flags.string({
      char: 't',
      description: 'Type of model',
      options: ['huggingface', 'custom'],
      required: true,
    }),
    url: Flags.string({description: 'HuggingFace URL (required for huggingface models)'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Workflow)
    const {modelName} = args
    const {apiKey, autoLoad, localModelPath, sshKeyFile, sshKeyTitle, type, url} = flags

    this.log(`Starting complete workflow for '${modelName}'...`)

    // Step 1: Register model
    this.log('\nStep 1: Registering model...')
    if ((type === 'huggingface' || type === 'ollama') && !url) {
      this.error('--url is required for HuggingFace and Ollama models')
    }

    await this.client.registerModel(modelName, type, url, apiKey)
    this.log('Model registered successfully!')

    // Step 2: For custom models, handle SSH and upload
    if (type === 'custom') {
      this.log('\nStep 2: Setting up SSH access...')

      if (sshKeyFile && sshKeyTitle) {
        if (!fs.existsSync(sshKeyFile)) {
          this.error(`SSH key file not found: ${sshKeyFile}`)
        }

        const sshKeyContent = fs.readFileSync(sshKeyFile, 'utf8').trim()
        try {
          await this.client.addSshKey(sshKeyTitle, sshKeyContent)
          this.log(`SSH key '${sshKeyTitle}' added successfully!`)
        } catch (error) {
          if (error instanceof Error && error.message.toLowerCase().includes('already exists')) {
            this.log('SSH key already exists, continuing...')
          } else {
            throw error
          }
        }
      }

      if (localModelPath) {
        this.log(`\nStep 3: Upload model files...`)
        this.log('To upload your model files, run the following commands:\n')
        this.log(`  git clone git@gitlab.regolo.ai:<username>/${modelName}.git`)
        this.log(`  cd ${modelName}`)
        this.log(`  cp -r ${localModelPath}/* .`)
        this.log(`  git add .`)
        this.log(`  git commit -m "Add model files"`)
        this.log(`  git push origin main\n`)

        const uploaded = await confirm({message: 'Have you completed the git upload?'})
        if (!uploaded) {
          this.log('Workflow paused. Complete the git upload and then run the load command manually.')
          return
        }

        this.log('Model files uploaded!')
      }
    }

    // Step 3: Auto-load for inference if requested
    if (autoLoad) {
      this.log('\nStep 3: Loading model for inference...')

      const gpusResult = await this.client.getAvailableGpus()
      const {gpus} = gpusResult as GpusResponse

      if (gpus.length === 0) {
        this.error('No GPUs available for inference')
      }

      let gpu: string
      if (gpus.length === 1) {
        gpu = gpus[0].InstanceType
        this.log(`Using GPU: ${gpu}`)
      } else {
        gpu = await select({
          choices: gpus.map((g) => ({name: `${g.InstanceType} - ${g.GpuModel}`, value: g.InstanceType})),
          message: 'Select GPU',
        })
      }

      await this.client.loadModelForInference(modelName, gpu)
      this.log(`Model '${modelName}' loading initiated on ${gpu}!`)
    }

    this.log('\nWorkflow completed successfully!')
    this.log(`  Model: ${modelName}`)
    this.log(`  Type:  ${type}`)
    if (autoLoad) this.log('  Status: Loading for inference...')
  }
}
