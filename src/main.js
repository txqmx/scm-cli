// 找到要执行的核心文件
// 1.要解析用户参数
const path = require('path')
const program = require('commander');
const {version} = require('./utils/constants');

// 配置命令
const actionsMap = {
    create: { // 创建模板
        description: 'create project',
        alias: 'cr',
        examples: ['scm-cli create <template-name>'],
    },
    '*': {
        description: 'command not found',
    }
};

// 循环创建命令
Object.keys(actionsMap).forEach(action => {
    program
        .command(action) // 命令名
        .alias(actionsMap[action].alias) // 别名
        .description(actionsMap[action].description) // 描述
        .action(() => {
           if(action === '*'){ // 如果动作没匹配到说明输入有误
               console.log(actionsMap[action].description);
           }else{ // 引用对应的动作文件 将参数传入
                require(path.resolve(__dirname,action))(...process.argv.slice(3))
           }
        })
});

// --help
program.on('--help', () => {
    console.log('Examples');
    Object.keys(actionsMap).forEach(action => {
        (actionsMap[action].examples || []).forEach(example => {
            console.log(`${example}`);
        })
    })
});

program.version(version)
    .parse(process.argv); // process.argv就是用户在命令行中传入的参数


