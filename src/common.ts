import * as core from '@actions/core'
import * as tmp from 'tmp'
import * as fs from 'fs'
import * as semver from 'semver'
import {context} from '@actions/github'
import {String} from 'typescript-string-operations'

const minimalWerfVersion = 'v1.1.17'

export async function SetupKubeConfig(
  kubeConfigBase64Data: string
): Promise<void> {
  const tmpFile = tmp.fileSync({keep: true})
  const buf = Buffer.from(kubeConfigBase64Data, 'base64').toString('ascii')
  fs.writeFileSync(tmpFile.name, buf)

  process.env.KUBECONFIG = tmpFile.name
  core.exportVariable('KUBECONFIG', tmpFile.name)
}

export function ProcessGitHubContext(): void {
  if (context.eventName === 'pull_request') {
    if (context.payload.pull_request) {
      const baseSha = context.payload.pull_request.base.sha
      const headSha = context.payload.pull_request.head.sha

      process.env.WERF_VIRTUAL_MERGE = '1'
      process.env.WERF_VIRTUAL_MERGE_FROM_COMMIT = headSha
      process.env.WERF_VIRTUAL_MERGE_INTO_COMMIT = baseSha

      core.exportVariable('WERF_VIRTUAL_MERGE', '1')
      core.exportVariable('WERF_VIRTUAL_MERGE_FROM_COMMIT', headSha)
      core.exportVariable('WERF_VIRTUAL_MERGE_INTO_COMMIT', baseSha)
    }
  }
}

export function ValidateWerfVersion(version: string): void {
  const ver = semver.coerce(version)
  if (ver) {
    if (semver.gte(ver, minimalWerfVersion)) {
      return
    }
  }

  throw new Error(
    String.Format(
      'werf version {0} is not supported (expected version should be equal or lower than {1})',
      version.trim(),
      minimalWerfVersion
    )
  )
}