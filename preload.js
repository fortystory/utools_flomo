const cp = require('child_process') //调用系统命令 cp.exec('notepad');
const https = require("https")
let api_url = "https://flomoapp.com/iwh/MzMxMTAz/2b6518eecb84daa77b45118e7b167f50/"

function post(api_url, send) {
    // alert(api_url)
    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    }
    let req = https.request(api_url, options, function(res) {
        // console.log('STATUS: ' + res.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(res.headers));
        // 定义了一个post变量，用于暂存请求体的信息
        let body = ""
        res.setEncoding('utf8')
            // 通过res的data事件监听函数，每当接受到请求体的数据，就累加到post变量中
        res.on('data', function(chunk) {
                // console.log('BODY: ' + chunk);
                body += chunk
            })
            // 在res的end事件触发后，通过JSON.parse将post解析为真正的POST请求格式，然后调用传递过来的回调函数处理数据
        res.on('end', function() {
            console.log("body = " + body);
            // let json = JSON.parse(body)
            // callback(json)
        })
    })
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message)
        alter('problem with request: ' + e.message)
    })
    req.write(send)
    req.end()
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
    console.log(tags)
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
    })
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
            update_tags(strs[0])
        }
    }
    post(api_url, JSON.stringify({ 'content': content }))
}

/**
 * 更新标签数组
 * @param {string} new_tag 新标签
 */
function update_tags(new_tag) {
    let need_add = true
    tags.map((tag) => {
        if (tag === new_tag) { //如果存在 忽略
            need_add = false
            console.log("tags no need update")
            return;
        }
    })
    if (need_add) {
        tags.push(new_tag)
        let res = utools.dbStorage.setItem("uflomo_tags", tags)
    }
}

/**
 * 判断字符串是否是标签
 * @param {string} str memo字符串
 * @returns bool
 */
function is_start_by_tag(str) {
    return str.indexOf("#") == 0
}

/**
 * 本地存储
 * @param {string} memo 
 * @returns boolean
 */
function put_local_memo(memo) {
    return true
}
window.exports = {
    "flomo_add_width_tag": { // 注意: 键对应的是 plugin.json 中的 features.code
        mode: 'list',
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
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
                utools.setSubInputValue(itemData.content)
                if (itemData.type === 'create_memo') {
                    window.utools.hideMainWindow()

                    // 发送emeo
                    send_memo(itemData.content)
                    utools.setSubInputValue('')
                    callbackSetList([])
                } else {
                    let search_list = get_next(itemData.content)
                    callbackSetList(search_list)
                }
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "创建memo带标签"
        }
    },
    "flomo_add": {
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
                window.utools.hideMainWindow()

                // 发送emeo
                send_memo(itemData.content)

                // window.utools.outPlugin() //这里不能退出插件,发送post请求时异步操作
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "创建memo"
        }
    }
}

//加载插件后获取存储的标签信息
utools.onPluginReady(() => {
    let _tags = utools.dbStorage.getItem("uflomo_tags")
    if (_tags === null || typeof _tags === 'undefined') {
        consle.log("uflomo_tags is null")
    } else {
        tags = _tags
    }
})