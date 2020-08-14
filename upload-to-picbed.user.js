// ==UserScript==
// @name        Upload to your picbed
// @version     0.1.0
// @description 上传图片到你的图床
// @author      staugur
// @namespace   https://www.saintic.com/
// @include     http://*
// @include     https://*
// @exclude     https://*.aliyun.com/*
// @run-at      document-start
// @grant       GM_info
// @created     2020-08-14
// @modified    none
// @github      https://github.com/staugur/userscript
// @supportURL  https://github.com/staugur/userscript/issues/
// ==/UserScript==

(function () {
    'use strict';

    const cfg = {
        "hot_key": "ctrlKey", // 允许的值: altKey shiftKey
        "api_url": "", // 图片上传接口地址
        "token": "", // 放在Header的 `Authorization: Token <here>` 用以验证
        "upload_name": "file", // 上传字段，按照服务端要求设置
        "id": "picbed-menu", // 不用改
    };

    let isObject = v => Object.prototype.toString.call(v) === '[object Object]',
        hasMenu = () => document.getElementById(cfg.id) ? true : false,
        getMenu = () => document.getElementById(cfg.id),
        hasSendingMenu = () => {
            if (hasMenu()) {
                let p = getMenu();
                if (p && p.dataset.sendStatus === "sending") {
                    return true;
                }
            }
            return false;
        },
        setBtnText = text => {
            if (text) getMenu().querySelector("button").textContent = text;
        },
        removeMenu = () => {
            if (hasMenu()) getMenu().remove();
        };

    function upload(src, opts) {
        if (!src) return false;
        if (!opts) opts = {};
        if (!isObject(opts)) return false;

        let data = new FormData();
        data.append(cfg.upload_name, src);
        data.append('origin', `userscript/${GM_info.script.version}`);
        Object.assign(opts, {
            url: cfg.api_url,
            method: "POST",
            headers: {
                Authorization: `Token ${cfg.token}`
            },
            data: data,
        });

        let xhr = new XMLHttpRequest(),
            error = typeof opts.error === 'function' ? opts.error : msg => {
                console.error(msg);
            };
        xhr.responseType = 'json';
        xhr.open(opts.method, opts.url, true);
        for (let key in opts.headers) {
            xhr.setRequestHeader(key, opts.headers[key]);
        }
        xhr.onloadstart = opts.start || null;
        xhr.onload = function () {
            typeof opts.success === 'function' && opts.success(xhr.response);
        };
        xhr.onerror = error("请求错误");
        try {
            xhr.send(opts.data);
        } catch (e) {
            error("网络异常");
        };
    }

    function createMenu(e, onClick) {
        if (hasSendingMenu()) return false;
        removeMenu();

        let src = e.target.src;
        let wrapperCss = [
            "position: absolute",
            `left: ${e.pageX}px`,
            `top:${e.pageY}px`,
            "z-index: 9999999",
            "width: 200px",
            "background-color: #fff",
            "color: #000",
            "text-align: center",
            "border: 1px #409eff solid",
            "font-size: 14px",
            "line-height: 24px",
            "overflow: hidden",
            "white-space: nowrap",
            `text-overflow: ".../${src.split("/").slice(-1)[0]}"`,
        ];
        let wrapper = document.createElement('div');
        wrapper.style.cssText = wrapperCss.join(";");
        wrapper.textContent = src;
        wrapper.setAttribute('id', cfg.id);

        let btnCss = [
            'display: block',
            'margin: 0 auto',
            'width: 100%',
            'padding: 5px 10px',
            'font-size: 12px',
            'background-color: #fff',
            'color: #409eff',
            'border: 0px',
            'cursor: pointer',
            'user-select: none',
        ];
        let btn = document.createElement('button');
        btn.style.cssText = btnCss.join(";");
        btn.textContent = "点击上传";
        btn.onclick = onClick;

        wrapper.appendChild(btn);
        document.body.appendChild(wrapper);
    }

    document.addEventListener('mousedown', function (e) {
        //恢复默认右键菜单
        document.oncontextmenu = null;
        //在图片上使用 快捷键+鼠标右击 打开自定义菜单
        if (e[cfg.hot_key] === true && e.button === 2) {
            if (e.target.tagName.toLowerCase() === 'img' && e.target.src) {
                //确定选中图片右键，打开上传菜单
                document.oncontextmenu = () => false;
                createMenu(e, () => {
                    let menu = getMenu();
                    menu.querySelector("button").onclick = null;
                    menu.querySelector("button").style.cursor = 'text';
                    if (/^(?:blob:|filesystem:)/.test(e.target.src)) {
                        setBtnText("不支持的图片格式");
                        return false;
                    }
                    upload(e.target.src, {
                        start: () => {
                            menu.dataset.sendStatus = "sending";
                            setBtnText("正在上传...");
                        },
                        success: res => {
                            if (res.code === 0) {
                                menu.dataset.sendStatus = "success";
                                setBtnText("上传成功");
                            } else {
                                menu.dataset.sendStatus = "fail";
                                setBtnText(res.msg);
                            }
                        },
                        error: msg => {
                            menu.dataset.sendStatus = "error";
                            setBtnText(msg);
                        },
                    });
                });
            }
        } else {
            //非面板内的点击/右击等操作（且无发送中状态）则关闭菜单
            if (e.target.id !== cfg.id && e.target.parentElement.id !== cfg.id) {
                if (!hasSendingMenu()) removeMenu();
            }
        }
    }, true);
})();