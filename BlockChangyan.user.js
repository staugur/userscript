// ==UserScript==
// @name         屏蔽畅言广告
// @namespace    https://www.saintic.com/
// @version      0.2
// @description  屏蔽畅言评论框下广告
// @author       staugur
// @match        http*://*/*
// @grant        GM_addStyle
// @icon         https://static.saintic.com/cdn/images/favicon-64.png
// @license      MIT
// @date         2018-06-01
// @modified     2018-06-15
// @github       https://github.com/staugur/scripts/blob/master/userscripts/BlockChangyan.user.js
// @supportURL   https://github.com/staugur/scripts/issues
// ==/UserScript==

(function() {
    'use strict';
    /*
        公共接口
    */
    //判断页面中id是否存在
    function hasId(id) {
        //有此id返回true，否则返回false
        var element = document.getElementById(id);
        if (element) {
            return true
        } else {
            return false
        }
    }
    /*
        主要代码
    */
    setTimeout(function() {
        if (hasId("feedAv") === true) {
            GM_addStyle('#feedAv{ margin-top: -250px!important;transform: scale(0);}');
            document.getElementById("feedAv").style.display = "none";
            document.getElementById('feedAv').id = "feedAvBak";
        }
    }, 1500);
})();