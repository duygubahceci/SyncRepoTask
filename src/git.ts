

import * as core from '@actions/core'
import  { getOctokitOptions } from  '@actions/github/lib/utils'
// import { throttling } from '@octokit/plugin-throttling'
import * as Octokit from "@octokit/rest"
import path from 'path'
import { context } from "./config";
import { execCmd } from "./helpers";

//import { Octokit } from '@octokit/rest'
class Git {
  github: any;
  existingPr: any;
  prBranch: any;
  baseBranch: any;
  repo: any;
  workingDir: any;
  gitUrl: any;

  constructor() {
    // const Octokit = GitHub.plugin(throttling)
    // core.debug(`context.token:${context.GITHUB_TOKEN}`);
    // const options = getOctokitOptions(context.GITHUB_TOKEN, {
		// 	throttle: {
		// 		onRateLimit: (retryAfter, options) => {
		// 			core.warning(`Request quota exhausted for request ${ options.method } ${ options.url }`)

		// 			if (options.request.retryCount === 0) {
		// 				// only retries once
		// 				core.info(`Retrying after ${ retryAfter } seconds!`)
		// 				return true
		// 			}
		// 		},
		// 		onAbuseLimit: (retryAfter, options) => {
		// 			// does not retry, only logs a warning
		// 			core.warning(`Abuse detected for request ${ options.method } ${ options.url }`)
		// 		}
		// 	}
		// })
    // const octokit = new Octokit(options)
		// // We only need the rest client
		// this.github = octokit.rest
    // core.debug(`Github ${ octokit.rest.users.getAuthenticated() }`)
  }

  async initRepo(repo) {
    core.info(`init repo:${ repo.name}`);
    this.baseBranch = 'main';

    // Set values to current repo
    this.repo = repo;
    this.workingDir = path.join(context.TMP_DIR, repo.uniqueName)
    core.info(`initrepo:${ this.workingDir}`);
    this.gitUrl = `https://${context.GITHUB_TOKEN}@${repo.fullName}.git`;

    await this.clone();
    core.info(`cloned :${ this.workingDir}`);
    //await this.getBaseBranch();
  }

  async clone() {
    core.info(`git clone --depth 1 ${this.gitUrl} ${this.workingDir}`);

    return execCmd(
      `git clone --depth 1 ${this.gitUrl} ${this.workingDir}`,this.workingDir

    );
  }

  async getBaseBranch() {
    core.info('getBaseBranch')
    this.baseBranch = await execCmd(
      `git rev-parse --abbrev-ref HEAD`,this.workingDir

    );
    core.info(`getBaseBranch ${this.baseBranch} in ${this.workingDir} `)
  }

  async add(file) {
    core.info( `file adding ${file} `)
    return execCmd(`git add -f ${file}`,this.workingDir);
  }
  async commit(msg) {
    core.info(`msg:${msg}`)
    let message ='sync file'

    return execCmd(
      `git commit -m ${message}`,this.workingDir
    );
  }

  async status() {
    return execCmd(`git status`,this.workingDir);
  }

  async push() {
    core.info(`gitURL:  ${this.gitUrl} `)
    return execCmd(`git push ${this.gitUrl} --force`,this.workingDir);
  }


  async createPrBranch() {


		let newBranch = path.join('new', this.repo.name,'branch')
		core.debug(`Creating PR Branch ${ newBranch }`)
		await execCmd(
			`git checkout -b "${ newBranch }"`,
			this.workingDir
		)
		this.prBranch = newBranch
	}

  async createPr( title) {
    const options = getOctokitOptions("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", {
			throttle: {
				onRateLimit: (retryAfter, options) => {
					core.warning(`Request quota exhausted for request ${ options.method } ${ options.url }`)

					if (options.request.retryCount === 0) {
						// only retries once
						core.info(`Retrying after ${ retryAfter } seconds!`)
						return true
					}
				},
				onAbuseLimit: (retryAfter, options) => {
					// does not retry, only logs a warning
					core.warning(`Abuse detected for request ${ options.method } ${ options.url }`)
				}
			}
		})

    const octokit = new Octokit.Octokit(options);
    core.info(`Creating new PR`);

   await octokit.request('POST /repos/{owner}/{repo}/pulls', {
      owner: 'duyguozkan',
      repo: 'sync-test',
      head: 'example',
      base: 'main'
    }).then().catch(err=> core.debug(err))

    const { data } = await octokit.pulls.create({
			owner: this.repo.user,
			repo: this.repo.name,
			title: title,
			body: 'PR for sync files action',
			head: this.prBranch,
			base: 'main'
		})

    return data;
  }

}
export { Git };
