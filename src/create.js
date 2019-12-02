// 模板文件在git上
const path = require('path');
const ora = require('ora');
const {downloadDirectory} = require('./utils/constants');

const { promisify } = require('util');
let downLoadGit = require('download-git-repo');
downLoadGit = promisify(downLoadGit);  // 转成promise

let ncp = require('ncp');
ncp = promisify(ncp);

// loading 封装
const wrapFetchAddLoading = (fn, message) => async (...args) => {
    const spinner = ora(message);
    spinner.start(); // 开始loading
    const r = await fn(...args);
    spinner.succeed(); // 结束loading
    return r
};

// 下载
const download = async (repo, tag) => {
    let api = `txqmx/${repo}`; // 下载项目
    if(tag){
        api += `#${tag}`
    }
    const dest = `${downloadDirectory}/${repo}`; // 将模板下载到对应的目录中
    await downLoadGit(api, dest);
    return dest; // 返回下载目录
};

module.exports = async (projectName) => {

    // 下载项目,返回目录
    const target = await wrapFetchAddLoading(download, 'download template')('scm-admin', 'v0.2.0');

    // 将下载的文件拷贝到当前执行命令的目录下
    await ncp(target, path.join(path.resolve(), projectName));
};
