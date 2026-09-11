(function () {
  var RealXHR = window.XMLHttpRequest;
  function MockXHR() {
    var self = this;
    this.readyState = 0;
    this.status = 0;
    this.responseText = '';
    this.response = '';
    this.responseType = '';
    this.responseTextValue = '';
    this.onload = null; this.onerror = null; this.onreadystatechange = null;
    this.requestHeaders = {};
    this.open = function (method, url) { this.__url = String(url); this.readyState = 1; };
    this.setRequestHeader = function () {};
    this.getAllResponseHeaders = function () { return 'content-type: application/json'; };
    this.getResponseHeader = function () { return 'application/json'; };
    this.abort = function () {};
    this.addEventListener = function (type, fn) { if (type === 'load') this.onload = fn; };
    this.removeEventListener = function () {};
    this.send = function () {
      if (this.__mock) {
        setTimeout(function () {
          self.readyState = 4; self.status = 200;
          self.response = self.responseText;
          if (self.onload) self.onload();
          if (self.onreadystatechange) self.onreadystatechange();
          if (self.onloadend) self.onloadend();
        }, 10);
      } else {
        var real = new RealXHR();
        ['onload','onerror','onreadystatechange','onprogress','ontimeout'].forEach(function (ev) {
          try { Object.defineProperty(real, ev, { get: function () { return self['on' + ev === undefined ? null : self.__get(ev)]; }, set: function (fn) { self['__' + 'h_' + Math.random()] = fn; } }); } catch (e) {}
        });
        real.open(self.__method || 'GET', self.__url || '/', true);
        real.onload = function () { self.status = real.status; self.responseText = real.responseText; self.response = real.response; self.readyState = 4; if (self.onload) self.onload(); if (self.onreadystatechange) self.onreadystatechange(); };
        real.send.apply(real, arguments);
      }
    };
    var origOpen = RealXHR.prototype.open;
  }
  window.XMLHttpRequest = function () { return new (function () {})(); };
})();
