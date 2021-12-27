const cp = require('child_process'); //调用系统命令 cp.exec('notepad');
const https = require("https");
let api_url = "";

function post(api_url, send) {
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    let req = https.request(api_url, options, function(res) {
        // console.log('STATUS: ' + res.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(res.headers));
        // 定义了一个post变量，用于暂存请求体的信息
        let body = "";
        res.setEncoding('utf8');
        // 通过res的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        res.on('data', function(chunk) {
            // console.log('BODY: ' + chunk);
            body += chunk;
        });
        // 在res的end事件触发后，通过JSON.parse将post解析为真正的POST请求格式，然后调用传递过来的回调函数处理数据
        res.on('end', function() {
            console.log("body = " + body);
            // let json = JSON.parse(body)
            // callback(json)
        })
    });
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        alter('problem with request: ' + e.message);
    });
    req.write(send);
    req.end();
}

// let tags = [
//     "learn/windows",
//     "learn/windows/ahk",
//     "learn/wsl",
//     "learn/wsl/arch",
//     "learn/rust",
//     "learn/rust/类型",
//     "learn/vim",
//     "learn/英语",
//     "log/下班",
//     "log/开始工作",
//     "log/日常/心情",
// ];
let tags = [];

/**
 * 获取前缀对应的数组
 * @param {string} prefix 前缀
 * @returns 返回能匹配到前缀的数组
 */
function get_next(prefix) {
    // console.log(tags);
    let search_list = []
    tags.map((tag) => {
        if (tag.indexOf(prefix) == 0) {
            search_list.push({
                title: tag,
                description: "tags",
                content: tag,
                icon: 'icons/logo.png', // 图标
                type: 'tags_list'
            });
        }
    });
    return search_list
}

/**
 * 发送memo
 * @param {string} content 
 * @returns 
 */
function send_memo(content) {
    console.log("content: " + content)
    let strs = new Array(); //定义一数组
    strs = content.split(" "); //字符分割
    if (strs.length >= 1) {
        if (is_start_by_tag(strs[0])) {
            //更新标签数据
            update_tags(strs[0]);
        }
    }
    post(api_url, JSON.stringify({ 'content': content }));
}

/**
 * 更新标签数组
 * @param {string} new_tag 新标签
 */
function update_tags(new_tag) {
    let need_add = true;
    tags.map((tag) => {
        if (tag === new_tag) { //如果存在 忽略
            need_add = false;
            // console.log("tags no need update");
            return;
        }
    })
    if (need_add) {
        tags.push(new_tag);
        let res = utools.dbStorage.setItem("uflomo_tags", tags);
    }
}

/**
 * 判断字符串是否是标签
 * @param {string} str memo字符串
 * @returns bool
 */
function is_start_by_tag(str) {
    return str.indexOf("#") == 0;
}

/**
 * 本地存储
 * @param {string} memo 
 * @returns boolean
 */
function put_local_memo(memo) {
    return true;
}

function check_api(as_check = false) {
    if (as_check == false) {
        if (api_url === "") {
            utools.showNotification('尚未配置flomo用户api url,请点击进行配置!', 'uflomo_config_api');
            // window.utools.outPlugin();
        }
        return true;
    }
    return !(api_url === "");
}


function set_api_url(api_url_str) {
    //配置api
    //校验是否是flomo的api url
    api_url_str = api_url_str.trim();
    let reg = /^https:\/\/flomoapp\.com\/[\w/ ]+$/;
    if (reg.test(api_url_str)) {
        utools.dbStorage.setItem("uflomo_api_url", api_url_str)
        utools.showNotification('flomo api url配置成功!');
    } else {
        utools.showNotification('输入的api url为: ' + api_url_str);
        utools.showNotification('flomo api url配置失败!请检查api url是否正确');
    }
    window.utools.outPlugin();
}


window.exports = {
    "uflomo_add_width_tag": { // 注意: 键对应的是 plugin.json 中的 features.code
        mode: 'list',
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                check_api();
                // 如果进入插件就要显示列表数据
                callbackSetList([{
                    title: '添加标签',
                    description: '输入 #标签',
                    content: "#",
                    icon: 'icons/logo.png', // 图标(可选)
                    type: 'tags_list',
                }])
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                // 获取一些数据
                // 执行 callbackSetList 显示出来
                // 判断最后的是否是空格  ??
                let search_list = get_next(searchWord)
                if (search_list.length == 0) {
                    let t_title = '创建memo并附带标签';
                    if (!is_start_by_tag(searchWord)) {
                        t_title = '创建memo';
                    }
                    search_list.push({
                        title: t_title,
                        description: searchWord,
                        content: searchWord,
                        icon: 'icons/logo.png', // 图标
                        type: 'create_memo',
                    })
                }
                callbackSetList(search_list)
            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                //判断itemData.content是否存在空格
                utools.setSubInputValue(itemData.content);
                if (itemData.type === 'create_memo') {
                    window.utools.hideMainWindow();

                    // 发送emeo
                    send_memo(itemData.content);
                    utools.setSubInputValue('');
                    callbackSetList([]);
                } else {
                    let search_list = get_next(itemData.content);
                    callbackSetList(search_list);
                }
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "创建memo带标签"
        }
    },
    "uflomo_add": {
        mode: 'list',
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                // 如果进入插件就要显示列表数据
                callbackSetList([{
                    title: '向flomo添加memo',
                    description: '输入内容',
                    icon: 'icons/logo.png' // 图标(可选)
                }])
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                // 获取一些数据
                // 执行 callbackSetList 显示出来
                callbackSetList(
                    [{
                        title: searchWord,
                        description: "编辑memo内容",
                        content: searchWord,
                        icon: 'icons/logo.png', // 图标
                    }]
                );
            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                window.utools.hideMainWindow();
                // 发送emeo
                send_memo(itemData.content);
                // window.utools.outPlugin() //这里不能退出插件,发送post请求时异步操作
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "创建memo"
        }
    },
    // "uflomo_custom_local_tag": {

    // },
    "uflomo_config_api": {
        mode: "list",
        args: {
            // 进入插件时调用
            enter: (action, callbackSetList) => {
                let _list = [];
                if (action.type == 'regex') { //直接在搜索框中输入api url
                    //如果已经配置
                    if (check_api(true)) {
                        _list = [{
                            title: '你已经配置了flomo api url,选择此项会更新api url',
                            description: "新的api为:" + action.payload,
                            content: action.payload,
                            icon: 'icons/logo.png',
                            type: 'config_api'
                        }];
                    } else {
                        set_api_url(action.payload);
                    }
                } else {
                    if (check_api(true)) {
                        _list.push({
                            title: '更新api url',
                            description: "你已经配置了flomo api url",
                            icon: 'icons/logo.png',
                            type: 'config_api'
                        });
                    } else {
                        _list.push({
                            title: '输入api url',
                            description: "配置flomo api url",
                            icon: 'icons/logo.png',
                            type: 'config_api'
                        });
                    }
                    _list.push({
                        title: '了解flomo api url',
                        description: '了解flomo api url',
                        icon: 'icons/logo.png',
                        type: 'url',
                        url: 'https://help.flomoapp.com/advance/api.html'
                    })
                    _list.push({
                        title: '查找你的flomo api url',
                        description: '查找你的flomo api url',
                        icon: 'icons/logo.png',
                        type: 'url',
                        url: 'https://flomoapp.com/mine?source=incoming_webhook'
                    });
                }
                callbackSetList(_list);
            },
            search: (action, searchWord, callbackSetList) => {
                let _list = [{
                    title: "api url为: " + searchWord,
                    description: "配置flomo api url",
                    content: searchWord,
                    icon: 'icons/logo.png',
                    type: 'config_api'
                }];
                callbackSetList(_list);
            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                // window.utools.hideMainWindow()
                if (itemData.type == 'config_api') {
                    set_api_url(itemData.content);
                } else if (itemData.type == 'url') {
                    utools.shellOpenExternal(itemData.url);
                    window.utools.outPlugin();
                }
            },
            placeholder: "在这里输入你的flomo api url"
        }
    },
}

//加载插件后获取存储的标签信息
utools.onPluginReady(() => {
    let _tags = utools.dbStorage.getItem("uflomo_tags")
    if (_tags === null || typeof _tags === 'undefined') {
        consle.log("uflomo: tags is null")
    } else {
        tags = _tags
    }

    let _api_url = utools.dbStorage.getItem("uflomo_api_url")
    console.log("api url: " + _api_url);
    if (_api_url === null || typeof _api_url === 'undefined') {
        consle.log("uflomo:api url is null")
    } else {
        api_url = _api_url
    }
})