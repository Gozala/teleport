
exports.print = function () {
    document.body.innerHTML += 
      '<pre>' + Array.prototype.join.call(arguments, ' ') + '</pre>'
}

exports.assert = function (guard, message) {
    if (guard) {
        exports.print('PASS ' + message, 'pass');
    } else {
        exports.print('FAIL ' + message, 'fail');
    }
};

