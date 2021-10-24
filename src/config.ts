import * as core from "@actions/core";
import yaml from "js-yaml";
import fs from "fs-extra";
import { getInput } from "action-input-parser";

type repo = {
  fullName: string;
  uniqueName: string;
  host: string;
  user: string;
  name: string;
  branch: string;
};

type file = {
      source: string;
      dest: string;
    };
let context: {
  GITHUB_TOKEN: any;
  TMP_DIR: any;
  CONFIG_PATH: any;
};

try {

  let token = getInput("GITHUB_PAT",{key: 'GITHUB_PAT'})

  context = {
    GITHUB_TOKEN: token,
    CONFIG_PATH: getInput("CONFIG_PATH", {
      key: "CONFIG_PATH",
      default: ".github/setting.yml",
    }),

    TMP_DIR: getInput("TMP_DIR", {
      key: "TMP_DIR",
      default: `tmp-${Date.now().toString()}`,
    })
  };
  core.debug(context.CONFIG_PATH);
  core.debug(context.GITHUB_TOKEN);

 // core.setSecret(context.GITHUB_TOKEN);

  while (fs.existsSync(context.TMP_DIR)) {
    context.TMP_DIR = `tmp-${Date.now().toString()}`;
    core.info(`TEMP_DIR already exists. Using "${context.TMP_DIR}" now.`);
  }
} catch (err) {
  process.exit(1);
}

const parseRepoName = (fullRepo: string) => {
  let host = "github.com";

  if (fullRepo.startsWith("http")) {
    const url = new URL(fullRepo);
    host = url.host;

    fullRepo = url.pathname.replace(/^\/+/, ""); // Remove leading slash

    core.info("Using custom host");
  }

  const user = fullRepo.split("/")[0];
  const name = fullRepo.split("/")[1].split("@")[0];
  const branch = fullRepo.split("@")[1] || "default";
 core.info( `parseRepoName ${host}/${user}/${name}`)
  return {
    fullName: `${host}/${user}/${name}`,
    uniqueName: `${host}/${user}/${name}@${branch}`,
    host,
    user,
    name,
    branch,
  };
};

function parseFiles(files: file[]) {
  core.info(`parseFiles ${files.length}`)
  return files.map((item) => {
    if (typeof item === "string") {
      return {
        source: item,
        dest: item
      };
    }

    if (item.source !== undefined) {
      return {
        source: item.source,
        dest: item.dest || item.source
      };
    }

    core.debug("Warn: No source files specified");
    return null;
  });
}

const parseConfig = async () => {
  const fileContent = await fs.promises.readFile(context.CONFIG_PATH);
  core.info(`config_path ${fileContent.toString()}`);
  const configObject = yaml.load(fileContent.toString());


  let result : any = {};
  Object.keys(configObject).forEach((key) => {
 core.info(`config_path ${key}`);
      const files = parseFiles(configObject[key]);
      const repo = parseRepoName(key);

  result = {
        repo,
        files,
      };

  });

  core.info(`result ${result.repo}`);
  return result;

};
export { context, parseConfig };
