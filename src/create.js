// 模板文件保证在git上
const path = require('path');
const axios = require('axios');
const ora = require('ora');
const Inquirer = require('inquirer');
const {downloadDirectory} = require('./utils/constants');

const { promisify } = require('util');
let downLoadGit = require('download-git-repo');
downLoadGit = promisify(downLoadGit);  // 转成promise

let ncp = require('ncp');
ncp = promisify(ncp);

// 自定义模板渲染
const fs = require('fs');
let MetalSmith = require('metalsmith'); // 遍历文件夹
let { render } = require('consolidate').ejs;
render = promisify(render); // 包装渲染方法


// 获取仓库列表
const fetchRepoList = async () => {
    // 获取当前用户中的所有仓库信息,这个仓库中存放的都是项目模板
    const {data} = await axios.get('https://api.github.com/users/txqmx/repos');
    return data
};

// 获取版本信息
const fetchTagList = async (repo) => {
    const {data} = await axios.get(`https://api.github.com/repos/txqmx/${repo}/tags`);
    return data
};

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
    let repos = await wrapFetchAddLoading(fetchRepoList, 'fetching repo list')();

    // 选择模板
    repos = repos.map(item => item.name);
    const {repo} = await Inquirer.prompt({
        name: 'repo',
        type: 'list',
        message: 'please choice repo template to create project',
        choices: repos, // 选择模式
    });

    // 获取版本信息
    let tags = await wrapFetchAddLoading(fetchTagList, 'fetching tag list')(repo);

    // 选择版本
    tags = tags.map((item) => item.name);
    const { tag } = await Inquirer.prompt({
        name: 'tag',
        type: 'list',
        message: 'please choice repo template to create project',
        choices: tags,
    });

    // 下载项目,返回目录
    const target = await wrapFetchAddLoading(download, 'download template')(repo, tag);

    // 没有ask文件说明不需要编译
    if(!fs.existsSync(path.join(target, 'ask.js'))){
        // 将下载的文件拷贝到当前执行命令的目录下
        await ncp(target, path.join(path.resolve(), projectName));
    }else {
        await new Promise((resolve,reject) => {
            MetalSmith(__dirname)
                .source(target) // 遍历下载的目录
                .destination(path.join(path.resolve(),projectName)) // 输出渲染后的结果
                .use(async (files, metal, done) => {
                    // 弹框询问用户
                    const result = await Inquirer.prompt(require(path.join(target, 'ask.js')));
                    const data = metal.metadata();
                    Object.assign(data, result); // 将询问的结果放到metadata中，保证在下一个中间件中可以获取到
                    delete files['ask.js'];
                    done();
                })
                .use((files,metal,done) => {
                    Reflect.ownKeys(files).forEach(async (file) => {
                        let content = files[file].contents.toString(); // 获取文件中的内容
                        if(file.includes('.js') || file.includes('.json')){ // 如果是js或者json才有可能是模板
                            if(content.includes('<%')){ // 文件中用<% 才编译
                                content = await render(content, metal.metadata()); // 用数据渲染模板
                                files[file].contents = Buffer.from(content); // 渲染好的结果替换即可
                            }
                        }
                    });
                    done()
                })
                .build(err => { // 执行中间件
                    if(!err){
                        resolve();
                    }else{
                        reject()
                    }
                })
        })
    }
};
