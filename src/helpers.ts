import fs from "fs-extra";
import { exec } from "child_process";
import * as core from "@actions/core";

const forEach = async (array, callback) => {
	for (let index = 0; index < array.length; index++) {
		// eslint-disable-next-line callback-return
		await callback(array[index], index, array)
	}
}
const execCmd = (command: string, workingDir: any) => {
	core.info(`EXEC: "${ command }" IN ${ workingDir }`)
	exec(command,
			{
				cwd: workingDir
			}
		)
}

const addSlash = (str: string) => (str.endsWith("/") ? str : str + "/");

const copy = async (
  src: string,
  dest: string

) => {
  core.info(`CP: ${src} TO ${dest}`);
  await fs.copy(src, dest);
};

export {
  forEach,
  addSlash,
  execCmd,
  copy
};
