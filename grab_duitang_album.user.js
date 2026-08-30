// ==UserScript==
// @name         堆糖网下载
// @namespace    https://www.saintic.com/
// @version      1.3.0
// @description  堆糖网(duitang.com)专辑图片批量下载到本地
// @author       staugur
// @match        http*://duitang.com/album/*
// @match        http*://www.duitang.com/album/*
// @grant        GM_setClipboard
// @grant        GM_info
// @grant        GM_download
// @icon         https://static.saintic.com/cdn/images/favicon-64.png
// @license      BSD 3-Clause License
// @date         2018-06-26
// @modified     2026-02-01
// @github       https://github.com/staugur/grab_huaban_board/blob/master/grab_duitang_album.js
// @supportURL   https://blog.saintic.com/blog/256.html
// ==/UserScript==

(function () {
    'use strict';
    //字符串是否包含子串
    function isContains(str, substr) {
        //str是否包含substr
        return str.indexOf(substr) >= 0;
    }
    //获取url查询参数
    function getUrlQuery(key, acq) {
        /*
            获取URL中?之后的查询参数，不包含锚部分，比如url为http://passport.saintic.com/user/message/?status=1&Action=getCount
            若无查询的key，则返回整个查询参数对象，即返回{status: "1", Action: "getCount"}；
            若有查询的key，则返回对象值，返回值可以指定默认值acq：如key=status, 返回1；key=test返回acq
        */
        let str = location.search;
        let obj = {};
        if (str) {
            str = str.substring(1, str.length);
            // 以&分隔字符串，获得类似name=xiaoli这样的元素数组
            let arr = str.split('&');
            //var obj = new Object();
            // 将每一个数组元素以=分隔并赋给obj对象
            for (let i = 0; i < arr.length; i++) {
                let tmp_arr = arr[i].split('=');
                obj[decodeURIComponent(tmp_arr[0])] = decodeURIComponent(tmp_arr[1]);
            }
        }
        return key ? obj[key] || acq : obj;
    }
    //计算百分比
    function calculatePercentage(num, total) {
        //小数点后两位百分比
        return Math.round((num / total) * 10000) / 100.0 + '%';
    }
    //加载js文件
    function addJS(src, cb) {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        document.getElementsByTagName('head')[0].appendChild(script);
        script.onload = typeof cb === 'function' ? cb : function () {};
    }
    //封装localStorage
    class StorageMix {
        constructor(key) {
            this.key = key;
            this.obj = window.localStorage;
            if (!this.obj) {
                console.error('浏览不支持localStorage');
                return false;
            }
        }

        //设置或跟新本地存储数据
        set(data) {
            if (data) {
                return this.obj.setItem(this.key, JSON.stringify(data));
            }
        }

        //获取本地存储数据
        get() {
            let data = null;
            try {
                data = JSON.parse(this.obj.getItem(this.key));
            } catch (e) {
                console.error(e);
            } finally {
                return data;
            }
        }

        clear() {
            //清除对象
            return this.obj.removeItem(this.key);
        }
    }
    //显示条款
    function showTerms(cb, onlyShow = false) {
        let s = new StorageMix('userTermsVer');
        if (s.get() !== 'yes') {
            let html = [
                '<blockquote style="padding:10px;border-left:5px solid #009688;border-radius:0 2px 2px 0;background-color:#f2f2f2;margin-bottom:10px;">',
                '本使用条款及免责声明（以下简称“本声明”）适用于',
                '所有用户脚本（以下简称“此脚本”），',
                '在您阅读本声明后若不同意此声明中的任何条款，',
                '或对本声明存在质疑，请立刻停止使用此脚本。',
                '若您已经开始或正在使用此脚本，则表示您已阅读并同意本声明的所有条款。',
                '</blockquote>',
                '<p style="color:red">总则：使用过程中请遵守所在国家或地区的相关法律法规。</p>',
                '<p>1. 此脚本使用localStorage存储公告、阅读条款状态等，不使用cookie技术。</p>',
                '<p>2. 此脚本不记录除远程方式外的下载情况，第三方Tdi下载与此脚本和作者无关。</p>',
                '<p>3. 此脚本使用BSD 3-Clause许可证开源，请遵循许可协议条款。</p>',
                '<p>4. 此脚本请个人使用，勿用于商业用途！</p>',
                '<p>5. 用户使用此脚本导致的版权、知识产权、所在网站本身侵权，此脚本作者概不负责！</p>',
                '<p>6. 用户须自己承担使用此脚本访问网站的风险，',
                '并承担为此而造成的风险责任，与作者本人及相关服务无关！</p>',
                '<p>7. 本声明可随时修改条款，如有变更通过公告发布，声明立时生效。</p>',
            ].join('');
            layer.open({
                type: 1,
                title: '使用条款与免责声明',
                closeBtn: 1,
                area: ['400px', '520px'],
                shade: 0.7,
                shadeClose: false,
                id: 'userTerm', //设定一个id，防止重复弹出
                btn: onlyShow !== true ? ['我同意', '我不同意'] : ['关闭'],
                btnAlign: 'c',
                scrollbar: false,
                content: '<div style="padding: 20px; line-height: 20px;">' + html + '</div>',
                zIndex: layer.zIndex,
                success: function (layero) {
                    layer.setTop(layero);
                },
                yes: function (index, layero) {
                    layer.close(index);
                    if (onlyShow !== true) {
                        s.set('yes');
                        typeof cb === 'function' && cb();
                    }
                },
            });
        } else {
            if (onlyShow !== true) {
                typeof cb === 'function' && cb();
            }
        }
    }
    //由于@require方式引入jquery时layer使用异常，故引用cdn中jquery v1.10.1；加载完成后引用又拍云中layer v3.1.1
    addJS('https://static.saintic.com/cdn/jquery/1.10.1/jquery.min.js', function () {
        $.noConflict();
        addJS('https://static.saintic.com/cdn/layer/3.5.1/layer.js');
    });
    var crawlhuaban_url = 'https://hub.saintic.com',
        blog_url = 'https://blog.saintic.com/blog/256.html';
    //正则
    var isEmail = /^[\w.\-]+@(?:[a-z0-9]+(?:-[a-z0-9]+)*\.)+[a-z]{2,3}$/i;
    // 设置提醒弹框
    function setupRemind() {
        let email = getReceiveBy('email') || '',
            token = getReceiveBy('token') || '';
        let content_overview = [
            '<div style="padding:20px;line-height:20px;font-weight:300;color:black">',
            '<h4><b>提醒设置：</b></h4>',
            '<div style="margin-left: 10px;">',
            '<p>仅供提交远程下载后查询下载进度、发送下载完成消息。</p>',
            `<p style="margin:8px 0;display:flex;align-items:center;gap:8px;"><a id="save_remind_email" class="submit-btn btn rbtn" href="javascript:;">保存邮箱</a><input style="flex:1;height:28px;line-height:28px;padding:0 8px;box-sizing:border-box;color:#777;background:#fcfcfc;border:1px solid #CCC" id="set_remind_email" type="text" placeholder="邮箱" value="${email}"></p>`,
            `<p style="margin:8px 0;display:flex;align-items:center;gap:8px;"><a id="save_remind_token" class="submit-btn btn rbtn" href="javascript:;">保存密钥</a><input style="flex:1;height:28px;line-height:28px;padding:0 8px;box-sizing:border-box;color:#777;background:#fcfcfc;border:1px solid #CCC" id="set_remind_token" type="text" placeholder="SaintIC Hub API 密钥" value="${token}"></p>`,
            `<p>可访问 <a href="${crawlhuaban_url}/CrawlHuaban/" target="_blank"><b>SaintIC Hub</b></a> 查询下载状态。</p>`,
            '</div>',
            `<p style="margin:12px 0 4px;"><b>问题帮助：</b><a href="javascript:;" id="grab_setting_help" title="查看帮助说明">查看FAQ</a>&nbsp;&nbsp;<a href="https://github.com/staugur/userscript/issues/new?assignees=&labels=&template=your-issue-topic.md&title=%E5%A0%86%E7%B3%96%E7%BD%91%E8%84%9A%E6%9C%AC%E5%8F%8D%E9%A6%88" target="_blank">在线反馈</a></p>`,
            '<h4 style="margin:8px 0;"><b><a href="javascript:;" id="reshow_userterms">查看使用条款与免责声明。</a></b></h4>',
            '</div>',
        ].join('');
        let content_help = [
            '<div style="padding: 20px;">',
            '<p><b>1. 什么是密钥？</b><br>&nbsp;&nbsp;答：密钥是在您在 SaintIC Hub 创建的<i>Api Token</i>，与用户一一对应，拥有它可以访问平台公共接口、处理您账号的相关事务等，此处仅作为您使用此脚本查询远端下载记录，以便及时下载完成的压缩包，省去了复制下载链接等步骤。切记密钥不可泄露，否则可能造成账号风险！</p>',
            `<p><b>2. 怎么创建密钥？</b><br>&nbsp;&nbsp;答：请登录 SaintIC Hub：<a href="${crawlhuaban_url}/control/" target="_blank">${crawlhuaban_url}</a>，在控制台处可以创建密钥！</p>`,
            '<p><b>3. 微信怎么查询下载进度？</b><br>&nbsp;&nbsp;答：请使用微信APP扫描此二维码并关注，发送"@下载链接"即可，服务器会返回下载状态。</p>',
            '</div>',
        ].join('');
        layer.open({
            type: 1,
            area: ['450px', '320px'],
            maxmin: true,
            resize: true,
            closeBtn: 1,
            shade: 0,
            title: '堆糖网下载脚本功能设置',
            btn: ['关闭'],
            btnAlign: 'c',
            moveType: 1, //拖拽模式，0或者1
            content: content_overview,
            success: function (layero, index) {
                let body = layer.getChildFrame('body', index);
                body.context.getElementById('save_remind_email').onclick = function () {
                    let value = body.context.getElementById('set_remind_email').value;
                    if (value && !isEmail.test(value)) {
                        layer.msg('请输入正确的邮箱地址');
                        return;
                    }
                    setupReceiveTo('email', value);
                };
                body.context.getElementById('save_remind_token').onclick = function () {
                    let value = body.context.getElementById('set_remind_token').value;
                    setupReceiveTo('token', value);
                };
                body.context.getElementById('grab_setting_help').onclick = function () {
                    layer.open({
                        type: 1,
                        area: ['350px', '350px'],
                        title: 'FAQ',
                        content: content_help,
                        closeBtn: 1,
                        shadeClose: false,
                        shade: 0,
                        zIndex: layer.zIndex,
                        success: function (layero) {
                            layer.setTop(layero);
                        },
                    });
                };
                body.context.getElementById('reshow_userterms').onclick = function () {
                    let s = new StorageMix('userTermsVer');
                    s.clear();
                    showTerms(null, true);
                };
            },
        });
    }
    /**
     * 设置接收信息
     * @param type 参数: email|token
     */
    function setupReceiveTo(type, value) {
        let es = new StorageMix('grab_duitang_album_remind_email');
        let ts = new StorageMix('grab_duitang_album_token');
        if (type === 'email') {
            if (value) {
                if (!isEmail.test(value)) {
                    layer.msg('请输入正确的邮箱地址');
                    return;
                }
                es.set(value);
                layer.msg('邮箱：' + value + '，设置成功！');
            } else {
                es.clear();
                layer.msg('邮箱已清空！');
            }
        } else if (type === 'token') {
            if (!value) {
                ts.clear();
                layer.msg('密钥已清空！');
            } else {
                ts.set(value);
                layer.msg('密钥设置成功！');
            }
        } else {
            layer.msg('暂不支持此方式！');
            return;
        }
    }
    /**
     * 读取接收信息值
     * @param type 参数: email|token
     */
    function getReceiveBy(type) {
        let str = '',
            es = new StorageMix('grab_duitang_album_remind_email'),
            ts = new StorageMix('grab_duitang_album_token');
        if (type === 'email') {
            str = es.get();
        } else if (type === 'token') {
            str = ts.get();
        }
        return str || '';
    }
    /*
        下载用户专辑接口
    */
    //交互确定专辑下载方式
    function interactiveAlbum(album_id, pins, pin_number, user_id) {
        var downloadMethod = 0;
        let msg = [
            '<div style="padding: 20px;"><b>当前专辑共' +
                pin_number +
                '张图片，抓取了' +
                pins.length +
                '张，抓取率：' +
                calculatePercentage(pins.length, pin_number) +
                '！</b><br/>',
            '<b>请选择以下三种下载方式：</b><br/>',
            '1. <i>文本</i>： <br/>&nbsp;&nbsp;&nbsp;&nbsp;即所有图片地址按行显示，提供复制，粘贴至下载工具批量下载即可(或<a href="https://satic.cn/gui_batchdownload.exe" target="_blank">这个工具</a>)，推荐使用此方式。<br/>',
            '2. <i>本地</i>： <br/>&nbsp;&nbsp;&nbsp;&nbsp;即所有图片直接保存到硬盘中，由于是批量下载，所以浏览器设置中请关闭"下载前询问每个文件的保存位置"，并且允许浏览器下载多个文件的授权申请，以保证可以自动批量保存，否则每次保存时会弹出询问，对您造成困扰。<br/>',
            '3. <i>远程</i>： <br/>&nbsp;&nbsp;&nbsp;&nbsp;即所有图片将由远端服务器下载并压缩，提供压缩文件链接，直接下载此链接解压即可。<br/>',
            `<br/><p><b>寻求帮助？</b><a href="${blog_url}" target="_blank" title="FAQ、彩蛋、文档等" style="color: green;">请点击我！</a></p></div>`,
        ].join('');
        layer.open({
            type: 1,
            title: '选择专辑图片下载方式',
            area: '450px',
            content: msg,
            closeBtn: 1,
            shadeClose: false,
            shade: 0,
            btn: ['文本', '本地', '远程'],
            btnAlign: 'c',
            zIndex: layer.zIndex,
            success: function (layero) {
                layer.setTop(layero);
            },
            yes: function (index, layero) {
                //文本方式下载，比如迅雷、QQ旋风
                downloadMethod = 1;
                layer.close(index);
                layer.open({
                    type: 1,
                    title: '文本方式下载',
                    content: '<div style="padding: 20px;"><b>请点击复制按钮，粘贴到迅雷等下载！</b></div>',
                    closeBtn: 1,
                    shadeClose: false,
                    shade: 0,
                    btn: '复制',
                    btnAlign: 'c',
                    maxmin: true,
                    zIndex: layer.zIndex,
                    success: function (layero) {
                        layer.setTop(layero);
                    },
                    yes: function (index, layero) {
                        layer.close(index);
                        GM_setClipboard(
                            pins
                                .map(function (pin) {
                                    return pin.imgUrl + '\n';
                                })
                                .join('')
                        );
                        layer.msg('复制成功');
                    },
                });
            },
            btn2: function (index, layero) {
                //本地下载
                downloadMethod = 2;
                layer.close(index);
                pins.map(function (pin) {
                    GM_download(pin.imgUrl, pin.imgName);
                });
            },
            btn3: function (index, layero) {
                //远端下载
                downloadMethod = 3;
                layer.close(index);
                // 提醒接收配置信息读取
                let email = getUrlQuery('email', getReceiveBy('email'));
                jQuery.ajax({
                    url: `${crawlhuaban_url}/CrawlHuaban/`,
                    type: 'POST',
                    data: {
                        site: 2,
                        version: GM_info.script.version,
                        board_total: pin_number,
                        board_id: album_id,
                        user_id: user_id,
                        pins: JSON.stringify(pins),
                        email: email,
                    },
                    beforeSend: function (request) {
                        request.setRequestHeader('Authorization', 'Bearer ' + getReceiveBy('token'));
                    },
                    success: function (res) {
                        if (res.success === true) {
                            let msg = [
                                '<div style="padding: 20px;"><b>下载任务已经提交！</b><br>根据专辑图片数量，所需时间不等，请稍等数分钟后访问下载链接：<br><i><a href="',
                                res.downloadUrl + '" target="_blank">',
                                res.downloadUrl + '</a></i><br>它将于<b>',
                                res.expireTime + '</b>过期，那时资源会被删除，请提前下载。',
                                res.tip + '</div>',
                            ].join('');
                            layer.open({
                                type: 1,
                                title: '温馨提示',
                                content: msg,
                                closeBtn: 1,
                                shadeClose: false,
                                shade: 0,
                                area: '390px',
                                btn: '我已知晓并复制下载链接',
                                btnAlign: 'c',
                                maxmin: true,
                                zIndex: layer.zIndex,
                                success: function (layero) {
                                    layer.setTop(layero);
                                },
                                yes: function (index, layero) {
                                    layer.close(index);
                                    GM_setClipboard(res.downloadUrl);
                                    let tips = '复制成功！';
                                    if (email) {
                                        tips += ' 接收提醒邮箱:' + email;
                                    }
                                    layer.msg(tips);
                                },
                            });
                        } else {
                            layer.msg('远端服务提示: ' + res.msg, {
                                time: 8000,
                            });
                        }
                    },
                });
            },
        });
    }
    //专辑解析与下载
    function downloadAlbum(album_id) {
        if (!album_id) {
            console.error('专辑ID不能为空');
            return false;
        }
        // get album info
        jQuery.ajax({
            url: `/napi/album/detail/?album_id=${album_id}`,
            async: true,
            success: function (res) {
                if (res.status != 1) {
                    console.error('专辑ID有误，获取专辑信息失败！');
                    return false;
                }
                console.group(`堆糖网下载-当前专辑：${album_id}`);
                let pin_number = res.data.count,
                    user_id = res.data.user.id,
                    run = true,
                    board_pins = [],
                    after_id = '',
                    load_index = layer.load(3, { shade: [0.3, '#000'] });
                while (run === true) {
                    jQuery.ajax({
                        url: `/napi/vienna/blog/by_album/?album_id=${album_id}&limit=100&after_id=${encodeURI(after_id)}`,
                        async: false,
                        success: function (res) {
                            if (res.status != 1) {
                                console.error('专辑ID有误，获取专辑图片列表失败！');
                                run = false;
                                return false;
                            }
                            board_pins = board_pins.concat(res.data.object_list);
                            console.debug(
                                `Current album <${album_id}> album number is ${pin_number}, get number is ${board_pins.length}, after: ${res.data.after}`
                            );
                            after_id = res.data.after;
                            if (!after_id || res.data.more === 0) {
                                console.log('专辑图片已全部获取，无需ajax加载更多图片');
                                run = false;
                                return false;
                            }
                        },
                    });
                }
                layer.close(load_index);
                console.log(`用户: ${user_id} 的专辑 ${album_id} 共抓取 ${board_pins.length} 个图片`);
                let pins = board_pins.map(function (pin) {
                    return {
                        imgUrl: pin.photo.path,
                        imgName: pin.id + '.' + pin.photo.path.split('.')[pin.photo.path.split('.').length - 1],
                    };
                });
                //交互确定下载方式
                interactiveAlbum(album_id, pins, pin_number, user_id);
                console.groupEnd();
            },
        });
    }
    /*
        主入口，分出不同模块：用户、专辑
    */
    var album_id = getUrlQuery('id');
    if (album_id != undefined && /^[0-9]*$/.test(album_id)) {
        //当前在专辑地址下
        let board_text = '下载此专辑',
            setup_text = '堆糖网设置';
        //当前是PC版，不予支持Mobile版
        let caa = document.getElementById('content').getElementsByClassName('album-action')[0];
        //插入下载专辑按钮
        if (isContains(caa.innerText, board_text) === false) {
            let tmpHtml =
                '<a href="javascript:;" id="setupRemind" style="display:inline-block;vertical-align:middle;width:90px;height:32px;line-height:32px;text-align:center;background-color:green;color:#fff;font-size:14px;border-radius:20px;text-decoration:none;margin-right:20px;"><span>' +
                setup_text +
                '</span></a>' +
                '<a href="javascript:;" id="downloadAlbum" style="display:inline-block;vertical-align:middle;width:90px;height:32px;line-height:32px;text-align:center;background-color:green;color:#fff;font-size:14px;border-radius:20px;text-decoration:none;margin-right:20px;"><span>' +
                board_text +
                '</span></a>';
            caa.style.width = 'auto';
            caa.insertAdjacentHTML('afterbegin', tmpHtml);
        }
        // 监听设置提醒按钮`
        document.getElementById('setupRemind').onclick = function () {
            setupRemind();
        };
        //监听专辑点击下载事件
        document.getElementById('downloadAlbum').onclick = function () {
            downloadAlbum(album_id);
        };
    }
})();
