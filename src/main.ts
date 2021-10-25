import * as core from "@actions/core";
import { Git } from "./git";
import {forEach,copy} from "./helpers";
import { parseConfig } from "./config";

type file = {
	dest: string,
	source: string
  };
  const run = async () => {
      core.info(`Start`);
      // Reuse octokit for each repo
      const git = new Git();
      const result = await parseConfig();


      core.info(`Repository Info`);
      core.info(`Repo Name  : ${result.repo.name}`);
      core.info(`Owner		: ${result.repo.user}`);
      core.info(`Https Url	: https://${result.repo.fullName}`);
      core.info(`Branch		: ${result.repo.branch}`);

      try {
		    core.info(`start `);
        // Clone and setup the git repository locally
        await git.initRepo(result.repo);
		    await git.createPrBranch();
        let commitMessage = "commit for sync files";
        core.info(
          `Syncing files between source and target repository for local repo `
        );
        // Loop through all selected files of the source repo
        await forEach(result.files, async (item: file) => {

        core.info(`file.source:${item.source}`)
        const localDestination = `${git.workingDir}/${item.dest}`;
        core.info(`localDestination ${localDestination} `)

        core.info('copy started')
        await copy(item.source, localDestination);
        await git.add(item.dest);
        await git.commit(commitMessage);
      //  await git.status()
        await	git.push();

        });

     	const pullRequest = await git.createPr(commitMessage);
        core.info(`	completed, created Pr ${pullRequest}`);
      } catch (err) {}


	};

run()
  .then(() => {})
  .catch((err) => { core.info(err)});
