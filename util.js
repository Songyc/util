var util = {
    // 方法extend将参数defaults和参数opt合并，并且支持多个参数合并。如果最后一个参数为布尔true，支持深度拷贝。参数defaults为默认对象, 参数opt是被合并对象。
    extend: function (target, src) {
        var args = Array.prototype.slice.call(arguments),
            len = args.length,
            deep, applyParam = [target];

        if(len === 1) {
            return target;
        }
        // 如果最后的参数是布尔值，则从参数数组args中删除。设置为数组applyParam的第三个元素
        if(typeof (deep = args[len - 1]) === 'boolean') {
            args.pop();
            applyParam[2] = deep;           
        }
        // 参数数组args删除目标对象，此时args中剩下只有源对象(被合并的对象)，获取源对象的个数
        args.shift();
        len = args.length;

        if(len > 1) {       // 如果源对象个数大于1, 遍历args，将源对象设置为数组applyParam的第二个元素，再次调用this.extend(target, src, deep);
            for(var i = 0; i < len; i++) {          
                applyParam[1] = args[i];
                this.extend.apply(null, applyParam); 
            }
        }else {
            for(var key in src) {           // 遍历源对象src, 检测它的自定义属性key。如果deep为true，表示支持拷贝对象最底层的属性值，并且key值为对象，调用this.extend(target, src, deep)方法。否则将源对象属性/值深度拷贝到目标对象上。
                if(src.hasOwnProperty(key)) {
                    if(deep === true && Object.prototype.toString.call(src[key]) === '[object Object]') {
                        this.extend(target, src[key], true);
                    }else {
                        target[key] = src[key];
                    }
                }
            }
        }
        return target;
    },

    parseUrl: function (url) {
        if(url.indexOf("?") < 0) {
            return {};
        }
        url = url.substr(url.indexOf("?")+1);   

        if(!url) {
            return {};
        }

        var list = url.split(/&|#/),
            item, prop = {};

        for(var i = 0, l = list.length; i < l; i++) {

            item = list[i].split('=');
            prop[item[0]] = item[1];
        }

        return prop;
    },

    addParam: function (url, key, value) {
        var hasSymbol, origin = url, prop = {},
            symbol = '?';

        hasSymbol = ~url.indexOf('?');

        if(hasSymbol) {
            url = url.match(/(.+?)\?/)[1];
        }

        if(typeof key === 'string'){
            prop[key] = value;
        }

        if(typeof key === 'object') {
            prop = key;
        }

        if(Object.prototype.toString.call(prop) === '[object Object]') {

            target = this.parseUrl(origin);

            prop = this.extend(target, prop);

            for(var i in prop) {
                if(prop.hasOwnProperty(i)) {
                    hasSymbol = ~url.indexOf('?');

                    if(hasSymbol) {
                        symbol = '&';
                    }

                    url += symbol + i + '=' + prop[i];
                }
            }
        }

        return url;
    },

    createIntervalAnimationObject: function () {
        var intervalAnimation = window.__intervalAnimation;

        if(!intervalAnimation) {
            intervalAnimation = window.__intervalAnimation = {
                uuid: 0,
                cache: {}
            };
        }

        return intervalAnimation;
    },

    intervalAnimation: function (selector, speed) {
        var intervalAnimation = this.createIntervalAnimationObject(),
            cache = intervalAnimation.cache, uuid, selectorCache,
            elems = selector;

        if(selector === undefined) {
            selector = '.interval-animation';
        }

        if(typeof selector === 'string') {
            elems = document.querySelectorAll(selector);
        }

        if(selector.nodeType === 1) {
            elems = [selector];
        }

        for(var i = 0, l = elems.length; i < l; i++) {

            uuid = elems[i].__intervalAnimationUuid;

            if(!uuid) {
                elems[i].__intervalAnimationUuid = uuid = ++intervalAnimation.uuid;
            }

            selectorCache = cache[uuid];

            if(!selectorCache) {
                cache[uuid] = selectorCache = {};
            }

            selectorCache.elem = elems[i];

            
            (function (i) {

                var children = elems[i].children,
                    firstChild = children.item(0);

                if(children.length == 1) {
                    var div = document.createElement('div');
                    elems[i].appendChild(div);
                }

                children = elems[i].children;

                if(!~firstChild.className.indexOf('cur')) {
                    firstChild.className += 'cur';
                }

                var index = 0,
                    timer, cur, item,
                    timerList;

                selectorCache.index = i;

                timerList = selectorCache.timer;

                if(!timerList) {
                    selectorCache.timerList = timerList = [];
                }

                timer = setInterval(function() {
                    cur = elems[i].querySelector('.cur');
                    item = children.item(++index) || children.item(index = 0);

                    cur && cur.classList.remove('cur');
                    item.classList.add('cur');
                }, speed || 500);

                timerList.push(timer);

            })(i);
        }
    },

    cleanIntervalAnimation: function (selector) {
        var intervalAnimation = this.createIntervalAnimationObject(),
            cache = intervalAnimation.cache, uuid, selectorCache,
            elems;

        function cleanSelectorInterval(selectorCache) {
            if(!selectorCache) {
                return;
            }

            var timerList = selectorCache.timerList,
                timer;

            timer = timerList[timerList.length - 1];
            clearInterval(timer);

            var parent = selectorCache.elem,
                children = parent.children,
                firstChild = children.item(0);

            for(var j = 0, m = children.length; j < m; j++) {
                children[j].classList.remove('cur');
            }

            firstChild.classList.add('cur');
        }

        if(selector === undefined) {
            for(var key in cache) {
                selectorCache = cache[key];

                cleanSelectorInterval(selectorCache);
            }
            return;
        }

        elems = selector;

        if(typeof selector === 'string') {
            elems = document.querySelectorAll(selector);
        }

        if(selector.nodeType === 1) {
            elems = [selector];
        }

        for(var i = 0, l = elems.length; i < l; i++) {
            uuid = elems[i].__intervalAnimationUuid;

            selectorCache = cache[uuid];

            cleanSelectorInterval(selectorCache);
        }
    },

    ajax: function (prop) {
        var xhr = this.createXMLHttpRequest(),
            config = this.ajaxConfig(), setRequestHeader,
            type, cache, url, data,
            async;

        prop = this.extend(config, prop);

        if(prop.type !== 'get' || prop.type !== 'post') {
            prop.type = type = 'get';
        } 

        url = prop.url;

        if(!url) {
            return;
        }

        data = prop.data;

        if(data) {
            url = this.addParam(url, data);
        }

        cache = prop.cache;

        if(!cache) {
            url = this.addParam(url, {t: 'util' + new Date().getTime()});
        }

        async = prop.async;

        xhr.open(type, url, async);

        setRequestHeader = prop.setRequestHeader; 

        if(setRequestHeader) {
            for(var key in setRequestHeader) {
                xhr.setRequestHeader(key, setRequestHeader[key]);
            }
        }

        xhr.send();

        prop.xhr = xhr;

        this.ajaxCompleted(prop);
    },

    ajaxCompleted: function (prop) {
        var xhr = prop.xhr,
            self = this, 
            async, success, responseText,
            data, dataType;

        async = prop.async;

        if(async) {

            xhr.onreadystatechange = function () {

                if(xhr.readyState === 4 && xhr.status === 200) {
                    responseText = xhr.responseText;

                    self.convertDataType(responseText, prop);

                }else {
                    fail = prop.fail;
                    if(fail) {
                        fail.call(xhr, xhr);
                    }
                }
            }
            
        }else {
            responseText = xhr.responseText;

            self.convertDataType(responseText, prop);
        }
    },

    convertDataType: function (responseText, prop) {
        var dataType = prop.dataType,
            data, self = this,
            rkey = /([^'"{}:,]+?):([^'"{}:,]+?)[,}]/g,
            rspace = /[\t\r\n\v]/g,
            rjson = /^\{/, 
            rjsonp = /^([a-zA-Z_$]+?)\s*\((\{.+?\})/;

        responseText = responseText.trim();

        responseText = responseText.replace(rspace, '');

        function stringConvertToJSON(responseText) {
            var obj = {};
        
            responseText.replace(rkey, function (r1, r2, r3) {
                r2 = r2.trim();
                r3 = r3.trim();
                obj[r2] = r3;
            });

            return obj;
        }

        function complete(data) {
            if(prop.success) {
                prop.success.call(prop.xhr, data);
            }else if(prop.fail) {
                prop.fail.call(prop.xhr, data);
            }
        }

        var convert = {
            json: function (responseText) {
                if(rjson.test(responseText)) {
                    var data = stringConvertToJSON(responseText);

                    complete(data);
                }
            },

            jsonp: function (responseText) {
                var data, name, container, result,
                    id;   

                result = responseText.match(rjsonp);

                if(result) {
                    name = result[1];
                    data = stringConvertToJSON(result[2]);

                    var script = document.createElement('script');
                    script.src = prop.url;
                    script.id = id;

                    window[name] = function (data) {
                        complete(data);

                        delete window[name];
                        document.querySelector('head').removeChild(script);
                    }

                    document.querySelector('head').appendChild(script);

                }else if(rjson.test(responseText)){
                   this.json(responseText);
                }
            },

            string: function (responseText) {
                complete(responseText);
            },

            js: function (responseText) {
                window.eval(responseText);
            },

            html: function (responseText) {
               complete(responseText);
            }
        }

        convert[dataType](responseText);
    },

    ajaxConfig: function () {
        var config = {
            type: 'get',
            url: '',
            async: true,
            cache: true,
            data: {},
            dataType: 'json',
            setRequestHeader: {
                "Content-type": "application/x-www-form-urlencoded"
            },
            success: null,
            fail: null
        }

        return config;
    },

    createXMLHttpRequest: function () {
        var xhr;

        if(window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        }else {
            xhr = new ActiveObject("Microsoft.XMLHTTP");
        }

        return xhr;
    },

    data: function (elem, key, value) {
        if(!elem) {
           return; 
        }

        if(elem.nodeType !== 1) {
            return elem;
        }

        var cache, uuid, elemCache;

        cache = this.cache;

        if(!cache) {
            this.cache = cache = {};
            cache.uuid = 0;
        }

        uuid = elem.uuid;

        if(!uuid) {
            elem.uuid = uuid = ++cache.uuid;
        }

        elemCache = cache[uuid];

        if(!elemCache) {
            cache[uuid] = elemCache = {};
        }

        if(value !== undefined) {
            elemCache[key] = value;
        }

        return elemCache[key];
    },

    removeData: function (elem, key) {
        if(!elem) {
            return;
        }

        var cache, uuid, elemCache,
            data;

        cache = this.cache;

        if(!cache) {
            return elem;
        }

        uuid = elem.uuid;

        if(!uuid) {
            return elem;
        }

        elemCache = cache[uuid];

        if(!elemCache) {
            return elem;
        }

        if(elemCache.hasOwnProperty(key)) {
            delete elemCache[key];
        }
    },

    replceSrc: function (target,type){
        var imgs = target.querySelectorAll("img"),
            img;
        
        if (!imgs) {
            return;   
        }

        for (var i = 0, len = imgs.length; i < len; i++) {
            img = imgs[i];
            
            if (img.getAttribute(type) && !img.getAttribute('loaded')) {
                img.src = img.getAttribute(type);
                img.setAttribute('loaded', 'true');
            }
        }
    }

}