// 存放用户所需的常量

const { name, version } = require('../../package.json');
// 下载暂存目录
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;
// 配置文件的存储位置
const configFile = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.scmrc`;
const defaultConfig = {
    repo: 'txqmx', // 默认拉取的仓库名
};

module.exports = {
    name,
    version,
    downloadDirectory,
    configFile,
    defaultConfig
};
