define("q/q/retry", ["q/util"], function(require, exports, module, undefined) { 
var Q = require("q/util");

exports.retry = retry;
function retry(callback, options) {
    options = options || {};
    options.start = options.start || new Date();
    return Q.when(callback(), undefined, function (reason) {
        if (options.times === undefined)
            options.times = Infinity;
        options.reasons = (options.reasons || []);
        options.reasons.push(reason);
        options.times -= 1;
        options.tries = (options.tries || 0) + 1;
        if (options.times <= 0) {
            options.stop = new Date();
            options.duration = options.stop - options.start;
            return Q.reject(options);
        } else {
            options.delay = Math.min(
                options.maxDelay || Infinity,
                (options.delay || 0) * (options.backOff || 1)
            );
            return Q.when(Q.delay(options.delay), function () {
                return retry(callback, options);
            });
        }
    });
};

 
/**/});