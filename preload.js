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
            search_list.push(tag);
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
            add_tag(strs[0]);
        }
    }
    post(api_url, JSON.stringify({ 'content': content }));
}

/**
 * 更新标签数组
 * @param {string} new_tag 新标签
 */
function add_tag(new_tag) {
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

function del_tag(tag_text) {
    let _tags = [];
    tags.map((tag) => {
        if (tag != tag_text) {
            _tags.push(tag);
        }
    });
    tags = _tags;
    utools.dbStorage.setItem("uflomo_tags", tags); //更新
}


function edit_tag(old_tag_text, new_tag_text) {
    let _tags = [];
    let tag_idx = -1;
    tags.map((tag, idx) => {
        if (tag == old_tag_text) {
            tag_idx = idx;
        }
        if (tag == new_tag_text) {
            utools.showNotification('编辑后的标签已经存在,请重新进行编辑!', 'uflomo_custom_local_tag');
            window.utools.outPlugin();
        }
    });
    if (tag_idx == -1) {
        utools.showNotification('标签不存在!', 'uflomo_custom_local_tag');
        window.utools.outPlugin();
    }
    tags[tag_idx] = new_tag_text;
    utools.dbStorage.setItem("uflomo_tags", tags); //更新
    utools.showNotification('标签更新成功!' + old_tag_text + "->" + new_tag_text);
    window.utools.outPlugin();
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


/**
 * 检查是否需要配置api url
 * @param {boolean} as_check 是否给出提示
 * @returns boolean
 */
function check_api(as_check = false) {
    if (as_check == false) {
        if (api_url === "") {
            utools.showNotification('尚未配置flomo用户api url,请点击进行配置!', 'uflomo_config_api');
            window.utools.outPlugin();
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
                // callbackSetList([{
                //     title: '输入标签',
                //     description: '输入 #标签',
                //     content: "#",
                //     icon: 'icons/logo.png', // 图标(可选)
                //     type: 'tags_list',
                // }])
                let search_list = [];
                tags.map((tag) => {
                    search_list.push({
                        title: tag,
                        description: tag,
                        content: tag,
                        icon: 'icons/logo.png', // 图标
                        type: 'tags_list'
                    });
                })
                callbackSetList(search_list)
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                // 获取一些数据
                // 执行 callbackSetList 显示出来
                let _tags = get_next(searchWord);
                let search_list = [];
                if (_tags.length == 0) {
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
                } else if (_tags.length == 1) {
                    if (searchWord != _tags[0]) {
                        search_list.push({
                            title: _tags[0],
                            description: _tags[0],
                            content: _tags[0],
                            icon: 'icons/logo.png', // 图标
                            type: 'tags_list',
                        });
                    }
                    search_list.push({
                        title: "创建只包含标签的memo",
                        description: searchWord,
                        content: searchWord,
                        icon: 'icons/logo.png', // 图标
                        type: 'create_memo',
                    });
                } else {
                    _tags.map((tag) => {
                        search_list.push({
                            title: tag,
                            description: tag,
                            content: tag,
                            icon: 'icons/logo.png', // 图标
                            type: 'tags_list'
                        });
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
            placeholder: "选择,输入标签新标签,或直接输入内容"
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
    "uflomo_custom_local_tag": {
        mode: "list",
        args: {
            enter: (action, callbackSetList) => {
                let search_list = [];
                tags.map((tag) => {
                    search_list.push({
                        title: tag,
                        description: "tags",
                        content: tag,
                        icon: 'icons/logo.png', // 图标
                        type: 'tags_list'
                    });
                });
                callbackSetList(search_list);
            },
            search: (action, searchWord, callbackSetList) => {
                let _tags = get_next(searchWord);
                let search_list = [];
                if (_tags.length == 0) {
                    search_list.push({
                        title: tag,
                        description: "tags",
                        content: tag,
                        icon: 'icons/logo.png',
                        type: 'tags_list'
                    });
                } else {
                    _tags.map((tag) => {
                        search_list.push({
                            title: tag,
                            description: "tags",
                            content: tag,
                            icon: 'icons/logo.png',
                            type: 'tags_list'
                        });
                    });
                }
                callbackSetList(search_list);
            },
            select: (action, itemData, callbackSetList) => {
                if (itemData.type == 'tags_list') { //从标签列表进入,进行操作选择 编辑或者删除
                    let select_list = [];
                    select_list.push({
                        title: "编辑",
                        description: "编辑" + itemData.content + "标签",
                        content: itemData.content,
                        icon: 'icons/logo.png',
                        type: 'edit_tag'
                    });
                    select_list.push({
                        title: "删除",
                        description: "删除" + itemData.content + "标签",
                        content: itemData.content,
                        icon: 'icons/logo.png',
                        type: 'del_tag'
                    });
                    callbackSetList(select_list);
                } else if (itemData.type == 'edit_tag') { //编辑需要输入新的标签
                    console.log(itemData);
                    old_content = itemData.content;
                    let select_list = [];
                    let new_content = itemData.content;
                    utools.setSubInputValue(old_content);
                    select_list = [{
                        title: "正在编辑标签",
                        description: "正在编辑标签",
                        content: new_content,
                        old_content: old_content,
                        icon: 'icons/logo.png',
                        type: 'do_edit_tag'
                    }];
                    callbackSetList(select_list);

                    // utools.setSubInputValue(old_content);

                    let is_fist_in = true;
                    utools.setSubInput(({ text }) => {
                        console.log("new tag:" + text);
                        if (is_fist_in) {
                            utools.setSubInputValue(old_content);
                            is_fist_in = false;
                        }
                        new_content = text;

                        select_list = [{
                            title: "正在编辑标签",
                            description: "正在编辑标签",
                            content: new_content,
                            old_content: old_content,
                            icon: 'icons/logo.png',
                            type: 'do_edit_tag'
                        }];
                        console.log("select_list");
                        console.log(select_list);
                        callbackSetList(select_list);
                    });
                } else if (itemData.type == 'do_edit_tag') {
                    utools.removeSubInput();
                    console.log("do_edit_tag");
                    console.log(itemData);
                    edit_tag(itemData.old_content, itemData.content);
                } else if (itemData.type == 'del_tag') { // tags_list 中选择了删除操作
                    del_tag(itemData.content);
                }
                //删除或编辑后,回到列表
                if (itemData.type != 'tags_list' && itemData.type != 'edit_tag' && itemData.type != "do_edit_tag") {
                    let search_list = [];
                    tags.map((tag) => {
                        search_list.push({
                            title: tag,
                            description: "tags",
                            content: tag,
                            icon: 'icons/logo.png', // 图标
                            type: 'tags_list'
                        });
                    });
                    callbackSetList(search_list);
                }
            },
            placeholder: "管理本地标签"
        }
    },
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
    let _tags = utools.dbStorage.getItem("uflomo_tags");
    if (_tags === null || typeof _tags === 'undefined') {
        consle.log("uflomo: tags is null");
    } else {
        tags = _tags;
    }

    let _api_url = utools.dbStorage.getItem("uflomo_api_url");
    console.log("api url: " + _api_url);
    if (_api_url === null || typeof _api_url === 'undefined') {
        consle.log("uflomo:api url is null")
    } else {
        api_url = _api_url;
    }
})