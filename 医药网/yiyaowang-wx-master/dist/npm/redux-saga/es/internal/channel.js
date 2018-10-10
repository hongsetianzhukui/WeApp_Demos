"use strict";var exports=module.exports={};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UNDEFINED_INPUT_ERROR = exports.INVALID_BUFFER = exports.isEnd = exports.END = undefined;

var _assign = require('../../../babel-runtime/core-js/object/assign.js');

var _assign2 = _interopRequireDefault(_assign);

exports.emitter = emitter;
exports.channel = channel;
exports.eventChannel = eventChannel;
exports.stdChannel = stdChannel;

var _utils = require('./utils.js');

var _buffers = require('./buffers.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _extends = _assign2.default || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

var CHANNEL_END_TYPE = '@@redux-saga/CHANNEL_END';
var END = exports.END = { type: CHANNEL_END_TYPE };
var isEnd = exports.isEnd = function isEnd(a) {
  return a && a.type === CHANNEL_END_TYPE;
};

function emitter() {
  var subscribers = [];

  function subscribe(sub) {
    subscribers.push(sub);
    return function () {
      return (0, _utils.remove)(subscribers, sub);
    };
  }

  function emit(item) {
    var arr = subscribers.slice();
    for (var i = 0, len = arr.length; i < len; i++) {
      arr[i](item);
    }
  }

  return {
    subscribe: subscribe,
    emit: emit
  };
}

var INVALID_BUFFER = exports.INVALID_BUFFER = 'invalid buffer passed to channel factory function';
var UNDEFINED_INPUT_ERROR = exports.UNDEFINED_INPUT_ERROR = 'Saga was provided with an undefined action';

if ("development" !== 'production') {
  exports.UNDEFINED_INPUT_ERROR = UNDEFINED_INPUT_ERROR += '\nHints:\n    - check that your Action Creator returns a non-undefined value\n    - if the Saga was started using runSaga, check that your subscribe source provides the action to its listeners\n  ';
}

function channel() {
  var buffer = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _buffers.buffers.fixed();

  var closed = false;
  var takers = [];

  (0, _utils.check)(buffer, _utils.is.buffer, INVALID_BUFFER);

  function checkForbiddenStates() {
    if (closed && takers.length) {
      throw (0, _utils.internalErr)('Cannot have a closed channel with pending takers');
    }
    if (takers.length && !buffer.isEmpty()) {
      throw (0, _utils.internalErr)('Cannot have pending takers with non empty buffer');
    }
  }

  function put(input) {
    checkForbiddenStates();
    (0, _utils.check)(input, _utils.is.notUndef, UNDEFINED_INPUT_ERROR);
    if (closed) {
      return;
    }
    if (!takers.length) {
      return buffer.put(input);
    }
    for (var i = 0; i < takers.length; i++) {
      var cb = takers[i];
      if (!cb[_utils.MATCH] || cb[_utils.MATCH](input)) {
        takers.splice(i, 1);
        return cb(input);
      }
    }
  }

  function take(cb) {
    checkForbiddenStates();
    (0, _utils.check)(cb, _utils.is.func, 'channel.take\'s callback must be a function');

    if (closed && buffer.isEmpty()) {
      cb(END);
    } else if (!buffer.isEmpty()) {
      cb(buffer.take());
    } else {
      takers.push(cb);
      cb.cancel = function () {
        return (0, _utils.remove)(takers, cb);
      };
    }
  }

  function flush(cb) {
    checkForbiddenStates(); // TODO: check if some new state should be forbidden now
    (0, _utils.check)(cb, _utils.is.func, 'channel.flush\' callback must be a function');
    if (closed && buffer.isEmpty()) {
      cb(END);
      return;
    }
    cb(buffer.flush());
  }

  function close() {
    checkForbiddenStates();
    if (!closed) {
      closed = true;
      if (takers.length) {
        var arr = takers;
        takers = [];
        for (var i = 0, len = arr.length; i < len; i++) {
          arr[i](END);
        }
      }
    }
  }

  return { take: take, put: put, flush: flush, close: close,
    get __takers__() {
      return takers;
    },
    get __closed__() {
      return closed;
    }
  };
}

function eventChannel(subscribe) {
  var buffer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _buffers.buffers.none();
  var matcher = arguments[2];

  /**
    should be if(typeof matcher !== undefined) instead?
    see PR #273 for a background discussion
  **/
  if (arguments.length > 2) {
    (0, _utils.check)(matcher, _utils.is.func, 'Invalid match function passed to eventChannel');
  }

  var chan = channel(buffer);
  var unsubscribe = subscribe(function (input) {
    if (isEnd(input)) {
      chan.close();
    } else if (!matcher || matcher(input)) {
      chan.put(input);
    }
  });

  if (!_utils.is.func(unsubscribe)) {
    throw new Error('in eventChannel: subscribe should return a function to unsubscribe');
  }

  return {
    take: chan.take,
    flush: chan.flush,
    close: function close() {
      if (!chan.__closed__) {
        chan.close();
        unsubscribe();
      }
    }
  };
}

function stdChannel(subscribe) {
  var chan = eventChannel(subscribe);

  return _extends({}, chan, {
    take: function take(cb, matcher) {
      if (arguments.length > 1) {
        (0, _utils.check)(matcher, _utils.is.func, 'channel.take\'s matcher argument must be a function');
        cb[_utils.MATCH] = matcher;
      }
      chan.take(cb);
    }
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW5uZWwuanMiXSwibmFtZXMiOlsiZW1pdHRlciIsImNoYW5uZWwiLCJldmVudENoYW5uZWwiLCJzdGRDaGFubmVsIiwiX2V4dGVuZHMiLCJ0YXJnZXQiLCJpIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwic291cmNlIiwia2V5IiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiQ0hBTk5FTF9FTkRfVFlQRSIsIkVORCIsInR5cGUiLCJpc0VuZCIsImEiLCJzdWJzY3JpYmVycyIsInN1YnNjcmliZSIsInN1YiIsInB1c2giLCJlbWl0IiwiaXRlbSIsImFyciIsInNsaWNlIiwibGVuIiwiSU5WQUxJRF9CVUZGRVIiLCJVTkRFRklORURfSU5QVVRfRVJST1IiLCJwcm9jZXNzIiwiZW52IiwiTk9ERV9FTlYiLCJidWZmZXIiLCJ1bmRlZmluZWQiLCJmaXhlZCIsImNsb3NlZCIsInRha2VycyIsImNoZWNrRm9yYmlkZGVuU3RhdGVzIiwiaXNFbXB0eSIsInB1dCIsImlucHV0Iiwibm90VW5kZWYiLCJjYiIsInNwbGljZSIsInRha2UiLCJmdW5jIiwiY2FuY2VsIiwiZmx1c2giLCJjbG9zZSIsIl9fdGFrZXJzX18iLCJfX2Nsb3NlZF9fIiwibm9uZSIsIm1hdGNoZXIiLCJjaGFuIiwidW5zdWJzY3JpYmUiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7UUFXZ0JBLE8sR0FBQUEsTztRQThCQUMsTyxHQUFBQSxPO1FBcUZBQyxZLEdBQUFBLFk7UUFxQ0FDLFUsR0FBQUEsVTs7QUFqS2hCOztBQUNBOzs7O0FBSEEsSUFBSUMsV0FBVyxvQkFBaUIsVUFBVUMsTUFBVixFQUFrQjtBQUFFLE9BQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJQyxVQUFVQyxNQUE5QixFQUFzQ0YsR0FBdEMsRUFBMkM7QUFBRSxRQUFJRyxTQUFTRixVQUFVRCxDQUFWLENBQWIsQ0FBMkIsS0FBSyxJQUFJSSxHQUFULElBQWdCRCxNQUFo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QUNBTTtBQUNEO0FBQ0Y7QUFSSSxHQUFQO0FBVUQ7O0FBRU0sU0FBU3JELFVBQVQsQ0FBb0JrQixTQUFwQixFQUErQjtBQUNwQyxNQUFJa0MsT0FBT3JELGFBQWFtQixTQUFiLENBQVg7O0FBRUEsU0FBT2pCLFNBQVMsRUFBVCxFQUFhbUQsSUFBYixFQUFtQjtBQUN4QlQsVUFBTSxTQUFTQSxJQUFULENBQWNGLEVBQWQsRUFBa0JVLE9BQWxCLEVBQTJCO0FBQy9CLFVBQUkvQyxVQUFVQyxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3hCLDBCQUFNOEMsT0FBTixFQUFlLFVBQUdQLElBQWxCLEVBQXdCLHFEQUF4QjtBQUNBSCwyQkFBWVUsT0FBWjtBQUNEO0FBQ0RDLFdBQUtULElBQUwsQ0FBVUYsRUFBVjtBQUNEO0FBUHVCLEdBQW5CLENBQVA7QUFTRCIsImZpbGUiOiJ1bmtub3duIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuaW1wb3J0IHsgaXMsIGNoZWNrLCByZW1vdmUsIE1BVENILCBpbnRlcm5hbEVyciB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgYnVmZmVycyB9IGZyb20gJy4vYnVmZmVycyc7XG5cbnZhciBDSEFOTkVMX0VORF9UWVBFID0gJ0BAcmVkdXgtc2FnYS9DSEFOTkVMX0VORCc7XG5leHBvcnQgdmFyIEVORCA9IHsgdHlwZTogQ0hBTk5FTF9FTkRfVFlQRSB9O1xuZXhwb3J0IHZhciBpc0VuZCA9IGZ1bmN0aW9uIGlzRW5kKGEpIHtcbiAgcmV0dXJuIGEgJiYgYS50eXBlID09PSBDSEFOTkVMX0VORF9UWVBFO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGVtaXR0ZXIoKSB7XG4gIHZhciBzdWJzY3JpYmVycyA9IFtdO1xuXG4gIGZ1bmN0aW9uIHN1YnNjcmliZShzdWIpIHtcbiAgICBzdWJzY3JpYmVycy5wdXNoKHN1Yik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByZW1vdmUoc3Vic2NyaWJlcnMsIHN1Yik7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVtaXQoaXRlbSkge1xuICAgIHZhciBhcnIgPSBzdWJzY3JpYmVycy5zbGljZSgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFycltpXShpdGVtKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1YnNjcmliZTogc3Vic2NyaWJlLFxuICAgIGVtaXQ6IGVtaXRcbiAgfTtcbn1cblxuZXhwb3J0IHZhciBJTlZBTElEX0JVRkZFUiA9ICdpbnZhbGlkIGJ1ZmZlciBwYXNzZWQgdG8gY2hhbm5lbCBmYWN0b3J5IGZ1bmN0aW9uJztcbmV4cG9ydCB2YXIgVU5ERUZJTkVEX0lOUFVUX0VSUk9SID0gJ1NhZ2Egd2FzIHByb3ZpZGVkIHdpdGggYW4gdW5kZWZpbmVkIGFjdGlvbic7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIFVOREVGSU5FRF9JTlBVVF9FUlJPUiArPSAnXFxuSGludHM6XFxuICAgIC0gY2hlY2sgdGhhdCB5b3VyIEFjdGlvbiBDcmVhdG9yIHJldHVybnMgYSBub24tdW5kZWZpbmVkIHZhbHVlXFxuICAgIC0gaWYgdGhlIFNhZ2Egd2FzIHN0YXJ0ZWQgdXNpbmcgcnVuU2FnYSwgY2hlY2sgdGhhdCB5b3VyIHN1YnNjcmliZSBzb3VyY2UgcHJvdmlkZXMgdGhlIGFjdGlvbiB0byBpdHMgbGlzdGVuZXJzXFxuICAnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hhbm5lbCgpIHtcbiAgdmFyIGJ1ZmZlciA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDogYnVmZmVycy5maXhlZCgpO1xuXG4gIHZhciBjbG9zZWQgPSBmYWxzZTtcbiAgdmFyIHRha2VycyA9IFtdO1xuXG4gIGNoZWNrKGJ1ZmZlciwgaXMuYnVmZmVyLCBJTlZBTElEX0JVRkZFUik7XG5cbiAgZnVuY3Rpb24gY2hlY2tGb3JiaWRkZW5TdGF0ZXMoKSB7XG4gICAgaWYgKGNsb3NlZCAmJiB0YWtlcnMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBpbnRlcm5hbEVycignQ2Fubm90IGhhdmUgYSBjbG9zZWQgY2hhbm5lbCB3aXRoIHBlbmRpbmcgdGFrZXJzJyk7XG4gICAgfVxuICAgIGlmICh0YWtlcnMubGVuZ3RoICYmICFidWZmZXIuaXNFbXB0eSgpKSB7XG4gICAgICB0aHJvdyBpbnRlcm5hbEVycignQ2Fubm90IGhhdmUgcGVuZGluZyB0YWtlcnMgd2l0aCBub24gZW1wdHkgYnVmZmVyJyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcHV0KGlucHV0KSB7XG4gICAgY2hlY2tGb3JiaWRkZW5TdGF0ZXMoKTtcbiAgICBjaGVjayhpbnB1dCwgaXMubm90VW5kZWYsIFVOREVGSU5FRF9JTlBVVF9FUlJPUik7XG4gICAgaWYgKGNsb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXRha2Vycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBidWZmZXIucHV0KGlucHV0KTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YWtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBjYiA9IHRha2Vyc1tpXTtcbiAgICAgIGlmICghY2JbTUFUQ0hdIHx8IGNiW01BVENIXShpbnB1dCkpIHtcbiAgICAgICAgdGFrZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIGNiKGlucHV0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0YWtlKGNiKSB7XG4gICAgY2hlY2tGb3JiaWRkZW5TdGF0ZXMoKTtcbiAgICBjaGVjayhjYiwgaXMuZnVuYywgJ2NoYW5uZWwudGFrZVxcJ3MgY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgICBpZiAoY2xvc2VkICYmIGJ1ZmZlci5pc0VtcHR5KCkpIHtcbiAgICAgIGNiKEVORCk7XG4gICAgfSBlbHNlIGlmICghYnVmZmVyLmlzRW1wdHkoKSkge1xuICAgICAgY2IoYnVmZmVyLnRha2UoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRha2Vycy5wdXNoKGNiKTtcbiAgICAgIGNiLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHJlbW92ZSh0YWtlcnMsIGNiKTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goY2IpIHtcbiAgICBjaGVja0ZvcmJpZGRlblN0YXRlcygpOyAvLyBUT0RPOiBjaGVjayBpZiBzb21lIG5ldyBzdGF0ZSBzaG91bGQgYmUgZm9yYmlkZGVuIG5vd1xuICAgIGNoZWNrKGNiLCBpcy5mdW5jLCAnY2hhbm5lbC5mbHVzaFxcJyBjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICBpZiAoY2xvc2VkICYmIGJ1ZmZlci5pc0VtcHR5KCkpIHtcbiAgICAgIGNiKEVORCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNiKGJ1ZmZlci5mbHVzaCgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgIGNoZWNrRm9yYmlkZGVuU3RhdGVzKCk7XG4gICAgaWYgKCFjbG9zZWQpIHtcbiAgICAgIGNsb3NlZCA9IHRydWU7XG4gICAgICBpZiAodGFrZXJzLmxlbmd0aCkge1xuICAgICAgICB2YXIgYXJyID0gdGFrZXJzO1xuICAgICAgICB0YWtlcnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIGFycltpXShFTkQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgdGFrZTogdGFrZSwgcHV0OiBwdXQsIGZsdXNoOiBmbHVzaCwgY2xvc2U6IGNsb3NlLFxuICAgIGdldCBfX3Rha2Vyc19fKCkge1xuICAgICAgcmV0dXJuIHRha2VycztcbiAgICB9LFxuICAgIGdldCBfX2Nsb3NlZF9fKCkge1xuICAgICAgcmV0dXJuIGNsb3NlZDtcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBldmVudENoYW5uZWwoc3Vic2NyaWJlKSB7XG4gIHZhciBidWZmZXIgPSBhcmd1bWVudHMubGVuZ3RoID4gMSAmJiBhcmd1bWVudHNbMV0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1sxXSA6IGJ1ZmZlcnMubm9uZSgpO1xuICB2YXIgbWF0Y2hlciA9IGFyZ3VtZW50c1syXTtcblxuICAvKipcclxuICAgIHNob3VsZCBiZSBpZih0eXBlb2YgbWF0Y2hlciAhPT0gdW5kZWZpbmVkKSBpbnN0ZWFkP1xyXG4gICAgc2VlIFBSICMyNzMgZm9yIGEgYmFja2dyb3VuZCBkaXNjdXNzaW9uXHJcbiAgKiovXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgIGNoZWNrKG1hdGNoZXIsIGlzLmZ1bmMsICdJbnZhbGlkIG1hdGNoIGZ1bmN0aW9uIHBhc3NlZCB0byBldmVudENoYW5uZWwnKTtcbiAgfVxuXG4gIHZhciBjaGFuID0gY2hhbm5lbChidWZmZXIpO1xuICB2YXIgdW5zdWJzY3JpYmUgPSBzdWJzY3JpYmUoZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgaWYgKGlzRW5kKGlucHV0KSkge1xuICAgICAgY2hhbi5jbG9zZSgpO1xuICAgIH0gZWxzZSBpZiAoIW1hdGNoZXIgfHwgbWF0Y2hlcihpbnB1dCkpIHtcbiAgICAgIGNoYW4ucHV0KGlucHV0KTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmICghaXMuZnVuYyh1bnN1YnNjcmliZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2luIGV2ZW50Q2hhbm5lbDogc3Vic2NyaWJlIHNob3VsZCByZXR1cm4gYSBmdW5jdGlvbiB0byB1bnN1YnNjcmliZScpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0YWtlOiBjaGFuLnRha2UsXG4gICAgZmx1c2g6IGNoYW4uZmx1c2gsXG4gICAgY2xvc2U6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgaWYgKCFjaGFuLl9fY2xvc2VkX18pIHtcbiAgICAgICAgY2hhbi5jbG9zZSgpO1xuICAgICAgICB1bnN1YnNjcmliZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0ZENoYW5uZWwoc3Vic2NyaWJlKSB7XG4gIHZhciBjaGFuID0gZXZlbnRDaGFubmVsKHN1YnNjcmliZSk7XG5cbiAgcmV0dXJuIF9leHRlbmRzKHt9LCBjaGFuLCB7XG4gICAgdGFrZTogZnVuY3Rpb24gdGFrZShjYiwgbWF0Y2hlcikge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNoZWNrKG1hdGNoZXIsIGlzLmZ1bmMsICdjaGFubmVsLnRha2VcXCdzIG1hdGNoZXIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICAgIGNiW01BVENIXSA9IG1hdGNoZXI7XG4gICAgICB9XG4gICAgICBjaGFuLnRha2UoY2IpO1xuICAgIH1cbiAgfSk7XG59Il19