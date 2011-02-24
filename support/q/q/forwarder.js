define("q/q/forwarder", ["q"], function(require, exports, module, undefined) { 
var Q = require("q");

exports.forwarder = forwarder;
function forwarder() {

    var to;
    var promise = Q.Promise({}, function () {
        return Q.send.apply(null, [to.promise].concat(arguments));
    });

    function detach() {
        to && to.reject('detached');
        to = Q.defer();
    }
    function attach(value) {
        to && to.resolve(value);
        to = Q.defer();
        to.resolve(value);
    }

    detach();

    return {
        "promise": promise,
        "attach": attach,
        "detach": detach
    };

}

function main() {
    function sink(name) {
        return Q.Promise({}, function () {
            console.log(name, arguments);
        });
    }
    var target = forwarder();
    target.attach(sink('a'));
    Q.when(target.promise);
    setTimeout(function () {
        target.attach(sink('b'));
        Q.when(target.promise);
        target.attach(sink('c'));
        Q.when(target.promise);
    }, 1000);
}

if (require.main === module)
    main();

 
/**/});