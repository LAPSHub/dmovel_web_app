// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.screen,
      AE: x0 => new ResizeObserver(x0),
      AF: x0 => x0.key,
      AG: x0 => x0.search,
      AH: (x0,x1) => x0.getElementsByClassName(x1),
      AI: x0 => x0.origin,
      AJ: x0 => x0.firstChild,
      AK: x0 => x0.iterator,
      AL: x0 => x0.name,
      AM: (x0,x1) => globalThis.IDBKeyRange.upperBound(x0,x1),
      AN: x0 => x0.send(),
      AO: x0 => x0.repeat,
      AP: x0 => x0.document,
      AQ: x0 => x0.accuracy,
      AR: x0 => x0.productSub,
      B: s => printToConsole(s),
      BB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      BE: (x0,x1) => x0.getPropertyValue(x1),
      BF: x0 => x0.identifier,
      BG: x0 => x0.location,
      BH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      BI: x0 => x0.location,
      BJ: x0 => x0.head,
      BK: () => globalThis.Symbol,
      BL: x0 => x0.repetitionCount,
      BM: (x0,x1) => x0.getKey(x1),
      BN: x0 => x0.status,
      BO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      BP: (x0,x1) => x0.querySelector(x1),
      BQ: x0 => x0.altitudeAccuracy,
      BR: x0 => x0.product,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Uint16Array(x0),
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.tabIndex,
      CE: x0 => globalThis.parseFloat(x0),
      CF: x0 => x0.touches,
      CG: x0 => x0.pathname,
      CH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      CI: () => globalThis.window,
      CJ: (x0,x1) => { x0.integrity = x1 },
      CK: (x0,x1) => new Intl.Segmenter(x0,x1),
      CL: x0 => x0.frameCount,
      CM: (x0,x1) => x0.index(x1),
      CN: x0 => x0.response,
      CO: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      CP: (x0,x1) => { x0.id = x1 },
      CQ: x0 => x0.altitude,
      CR: x0 => x0.languages,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (x0,x1) => x0.contains(x1),
      DE: (x0,x1) => x0.getComputedStyle(x1),
      DF: x0 => x0.pressure,
      DG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      DH: (x0,x1) => x0.dispatchEvent(x1),
      DI: (o, p) => p in o,
      DJ: (x0,x1) => { x0.src = x1 },
      DK: x0 => x0.Segmenter,
      DL: x0 => x0.selectedTrack,
      DM: x0 => x0.name,
      DN: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      DO: (x0,x1,x2) => x0.setAttribute(x1,x2),
      DP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      DQ: x0 => x0.timestamp,
      DR: x0 => x0.language,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: x0 => x0.activeElement,
      EE: x0 => x0.documentElement,
      EF: x0 => x0.tiltY,
      EG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      EH: (x0,x1) => x0.createEvent(x1),
      EI: x0 => x0.groups,
      EJ: x0 => x0.trustedTypes,
      EK: () => new TextDecoder(),
      EL: x0 => x0.completed,
      EM: x0 => x0.multiEntry,
      EN: (x0,x1) => { x0.responseType = x1 },
      EO: (x0,x1) => { x0.cursor = x1 },
      EP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      EQ: x0 => x0.longitude,
      ER: x0 => x0.deviceMemory,
      F: () => new Error().stack,
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: x0 => x0.parentNode,
      FE: x0 => x0.computedStyleMap(),
      FF: x0 => x0.tiltX,
      FG: o => Object.keys(o),
      FH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      FI: secondsSinceEpoch => {
        const date = new Date(secondsSinceEpoch * 1000);
        const match = /\((.*)\)/.exec(date.toString());
        if (match == null) {
            // This should never happen on any recent browser.
            return '';
        }
        return match[1];
      },
      FJ: (x0,x1) => { x0.crossOrigin = x1 },
      FK: a => a.pop(),
      FL: x0 => x0.ready,
      FM: x0 => x0.unique,
      FN: () => new XMLHttpRequest(),
      FO: (x0,x1) => { x0.height = x1 },
      FP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      FQ: x0 => x0.latitude,
      FR: x0 => x0.appVersion,
      G: s => JSON.stringify(s),
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: x0 => x0.tagName,
      GE: (x0,x1) => x0.get(x1),
      GF: x0 => x0.pointerType,
      GG: x0 => x0.state,
      GH: x0 => x0.readText(),
      GI: x0 => x0.devicePixelRatio,
      GJ: (x0,x1) => x0.createElement(x1),
      GK: (map, o, v) => map.set(o, v),
      GL: x0 => x0.tracks,
      GM: x0 => x0.keyPath,
      GN: (a, l) => a.length = l,
      GO: (x0,x1) => { x0.width = x1 },
      GP: (x0,x1) => { x0.onerror = x1 },
      GQ: x0 => x0.coords,
      GR: x0 => x0.appName,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: x0 => x0.target,
      HE: (o, p) => p in o,
      HF: x0 => x0.pointerId,
      HG: x0 => x0.hash,
      HH: x0 => x0.clipboard,
      HI: x0 => x0.availWidth,
      HJ: x0 => globalThis.setAppLanguage(x0),
      HK: () => globalThis.dmovelLoader.markFlutterReady(),
      HL: () => globalThis.window.ImageDecoder,
      HM: (x0,x1) => x0.get(x1),
      HN: x0 => globalThis.URL.createObjectURL(x0),
      HO: (x0,x1) => { x0.display = x1 },
      HP: (x0,x1) => { x0.oncancel = x1 },
      HQ: x0 => x0.sessionStorage,
      HR: x0 => x0.appCodeName,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.clientY,
      IE: (x0,x1) => { x0.textContent = x1 },
      IF: x0 => x0.getCoalescedEvents(),
      IG: x0 => x0.state,
      IH: (x0,x1) => x0.writeText(x1),
      II: x0 => x0.availHeight,
      IJ: (x0,x1,x2) => x0.insertBefore(x1,x2),
      IK: () => new FileReader(),
      IL: x0 => x0.naturalHeight,
      IM: (x0,x1) => x0.objectStore(x1),
      IN: x0 => ({type: x0}),
      IO: (x0,x1) => { x0.opacity = x1 },
      IP: (x0,x1) => { x0.onchange = x1 },
      IQ: (x0,x1,x2,x3) => x0.decrypt(x1,x2,x3),
      IR: x0 => x0.length,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.clientX,
      JE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JF: (x0,x1) => x0.getModifierState(x1),
      JG: (x0,x1) => x0.go(x1),
      JH: x0 => x0.unlock(),
      JI: x0 => x0.screen,
      JJ: x0 => x0.id,
      JK: (x0,x1) => x0.readAsArrayBuffer(x1),
      JL: x0 => x0.naturalWidth,
      JM: x0 => x0.autoIncrement,
      JN: (x0,x1) => new Blob(x0,x1),
      JO: x0 => x0.style,
      JP: x0 => x0.type,
      JQ: x0 => x0.subtle,
      JR: x0 => x0.getReader(),
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      KE: x0 => x0.matches,
      KF: s => s.trimLeft(),
      KG: x0 => x0.parentElement,
      KH: (x0,x1) => x0.lock(x1),
      KI: x0 => x0.type,
      KJ: x0 => x0.offsetHeight,
      KK: x0 => x0.result,
      KL: (x0,x1) => x0.createElement(x1),
      KM: x0 => x0.keyPath,
      KN: o => o.byteLength,
      KO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      KP: x0 => x0.lastModified,
      KQ: x0 => x0.crypto,
      KR: x0 => x0.value,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.getBoundingClientRect(),
      LE: (x0,x1) => x0.matchMedia(x1),
      LF: (x0,x1) => x0[x1],
      LG: (x0,x1) => x0.querySelectorAll(x1),
      LH: x0 => x0.orientation,
      LI: x0 => x0.orientation,
      LJ: x0 => x0.offsetWidth,
      LK: () => new XMLHttpRequest(),
      LL: (x0,x1) => { x0.pointerEvents = x1 },
      LM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      LN: Function.prototype.call.bind(DataView.prototype.getBigUint64),
      LO: x0 => x0.preventDefault(),
      LP: x0 => x0.name,
      LQ: x0 => x0.isSecureContext,
      LR: x0 => x0.done,
      M: o => String(o),
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      ME: x0 => x0.matches,
      MF: x0 => x0.index,
      MG: (d, digits) => d.toFixed(digits),
      MH: (x0,x1) => x0.querySelector(x1),
      MI: x0 => x0.deviceMemory,
      MJ: x0 => x0.stopPropagation(),
      MK: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      ML: (x0,x1) => { x0.height = x1 },
      MM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      MN: x0 => x0.disconnect(),
      MO: x0 => x0.shiftKey,
      MP: (x0,x1) => x0.item(x1),
      MQ: (x0,x1,x2,x3,x4,x5,x6,x7) => x0.unwrapKey(x1,x2,x3,x4,x5,x6,x7),
      MR: x0 => x0.read(),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: s => new Date(s * 1000).getTimezoneOffset() * 60,
      NE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      NF: s => s.toUpperCase(),
      NG: x0 => x0.maxHeight,
      NH: (x0,x1) => { x0.title = x1 },
      NI: x0 => x0.onLine,
      NJ: x0 => x0.disabled,
      NK: x0 => x0.send(),
      NL: (x0,x1) => { x0.width = x1 },
      NM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      NN: x0 => x0.disconnect(),
      NO: x0 => x0.metaKey,
      NP: x0 => x0.length,
      NQ: (x0,x1,x2,x3,x4,x5) => x0.importKey(x1,x2,x3,x4,x5),
      NR: x0 => x0.body,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: Date.now,
      OE: f => f.dartFunction,
      OF: x0 => x0.pop(),
      OG: x0 => x0.maxWidth,
      OH: (x0,x1) => x0.vibrate(x1),
      OI: x0 => x0.navigator,
      OJ: (x0,x1) => { x0.min = x1 },
      OK: x0 => x0.type,
      OL: x0 => x0.style,
      OM: (x0,x1) => { x0.oncomplete = x1 },
      ON: (x0,x1) => x0.renderButton(x1),
      OO: x0 => x0.altKey,
      OP: x0 => x0.files,
      OQ: (x0,x1,x2,x3) => x0.generateKey(x1,x2,x3),
      OR: x0 => x0.assetBase,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: (handle) => clearTimeout(handle),
      PE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PF: x0 => x0.flags,
      PG: x0 => x0.minHeight,
      PH: x0 => x0.arrayBuffer(),
      PI: x0 => x0.pathname,
      PJ: (x0,x1) => { x0.max = x1 },
      PK: x0 => x0.response,
      PL: (x0,x1) => { x0.src = x1 },
      PM: (x0,x1) => { x0.onabort = x1 },
      PN: (x0,x1,x2) => x0.renderButton(x1,x2),
      PO: x0 => x0.ctrlKey,
      PP: (x0,x1) => x0.replaceChildren(x1),
      PQ: (x0,x1,x2,x3,x4) => x0.wrapKey(x1,x2,x3,x4),
      PR: x0 => x0.loader,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: (x0,x1) => x0.closest(x1),
      QE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      QF: (a, s) => a.join(s),
      QG: x0 => x0.minWidth,
      QH: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      QI: x0 => x0.userAgent,
      QJ: (x0,x1) => { x0.disabled = x1 },
      QK: (x0,x1) => { x0.responseType = x1 },
      QL: () => globalThis.document,
      QM: (x0,x1) => { x0.onerror = x1 },
      QN: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => ({type: x0,theme: x1,size: x2,text: x3,shape: x4,logo_alignment: x5,width: x6,locale: x7,click_listener: x8}),
      QO: (x0,x1) => x0.getAttribute(x1),
      QP: x0 => x0.click(),
      QQ: (x0,x1,x2) => x0.exportKey(x1,x2),
      QR: () => globalThis._flutter,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: x0 => x0.bottom,
      RE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      RF: (x0,x1) => x0.error(x1),
      RG: (x0,x1) => x0.removeProperty(x1),
      RH: x0 => x0.status,
      RI: (x0,x1) => x0.matchMedia(x1),
      RJ: (x0,x1) => { x0.scrollLeft = x1 },
      RK: x0 => x0.vendor,
      RL: x0 => x0.src,
      RM: x0 => x0.error,
      RN: () => globalThis.google.accounts.id,
      RO: (x0,x1) => x0.closest(x1),
      RP: (x0,x1) => { x0.accept = x1 },
      RQ: (x0,x1) => x0.getRandomValues(x1),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.top,
      SE: (o, i) => o[i],
      SF: () => globalThis.console,
      SG: (x0,x1) => x0.add(x1),
      SH: (x0,x1) => x0.fetch(x1),
      SI: x0 => x0.matches,
      SJ: (x0,x1) => { x0.spellcheck = x1 },
      SK: x0 => x0.size,
      SL: x0 => x0.nextSibling,
      SM: x0 => x0.name,
      SN: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SO: x0 => x0.tagName,
      SP: (x0,x1) => { x0.multiple = x1 },
      SQ: (x0,x1,x2,x3) => x0.encrypt(x1,x2,x3),
      T: x0 => new Promise(x0),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.right,
      TE: o => o.length,
      TF: s => s.trimRight(),
      TG: x0 => x0.data,
      TH: x0 => x0.content,
      TI: x0 => x0.platform,
      TJ: (x0,x1) => { x0.disabled = x1 },
      TK: (x0,x1,x2,x3) => x0.putImageData(x1,x2,x3),
      TL: (x0,x1) => x0.debug(x1),
      TM: (x0,x1) => x0.item(x1),
      TN: x0 => new MutationObserver(x0),
      TO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      TP: (x0,x1) => { x0.type = x1 },
      TQ: () => globalThis.removeSplashFromWeb(),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (x0,x1) => x0.exec(x1),
      UD: x0 => x0.left,
      UE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      UF: x0 => x0.blur(),
      UG: (x0,x1) => { x0.scrollTop = x1 },
      UH: x0 => x0.document,
      UI: (x0,x1) => x0.sendEnvelope(x1),
      UJ: (x0,x1) => x0.transferFromImageBitmap(x1),
      UK: x0 => x0.arrayBuffer(),
      UL: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      UM: x0 => x0.length,
      UN: x0 => ({childList: x0}),
      UO: (x0,x1,x2) => x0.setItem(x1,x2),
      UP: (x0,x1) => x0.debug(x1),
      UQ: x0 => x0.measurementId,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: x0 => x0.length,
      VD: x0 => x0.clientY,
      VE: x0 => x0.language,
      VF: x0 => x0.button,
      VG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      VH: x0 => new WeakRef(x0),
      VI: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      VJ: (x0,x1) => x0.getContext(x1),
      VK: (x0,x1) => { x0.height = x1 },
      VL: (a, s, e) => a.slice(s, e),
      VM: x0 => x0.objectStoreNames,
      VN: (x0,x1,x2) => x0.observe(x1,x2),
      VO: x0 => x0.localStorage,
      VP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      VQ: x0 => x0.appId,
      W: x0 => new Array(x0),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (x0,x1) => { x0.lastIndex = x1 },
      WD: x0 => x0.clientX,
      WE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      WF: x0 => x0.innerHeight,
      WG: (x0,x1) => { x0.value = x1 },
      WH: x0 => x0.deref(),
      WI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      WJ: (x0,x1) => { x0.height = x1 },
      WK: (x0,x1) => { x0.width = x1 },
      WL: () => globalThis.getPwaHostPlatform(),
      WM: (x0,x1,x2) => x0.transaction(x1,x2),
      WN: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      WO: (x0,x1) => x0.getItem(x1),
      WP: (x0,x1) => x0.createScriptURL(x1),
      WQ: x0 => x0.messagingSenderId,
      X: o => [o],
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      XD: x0 => x0.changedTouches,
      XE: () => globalThis.window.FinalizationRegistry,
      XF: x0 => x0.innerWidth,
      XG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      XH: () => globalThis.WeakRef,
      XI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      XJ: (x0,x1) => { x0.width = x1 },
      XK: x0 => x0.convertToBlob(),
      XL: () => globalThis.triggerPwaInstall(),
      XM: x0 => x0.key,
      XN: x0 => new ResizeObserver(x0),
      XO: (x0,x1) => x0.key(x1),
      XP: (x0,x1) => x0.appendChild(x1),
      XQ: x0 => x0.authDomain,
      Y: (o0, o1) => [o0, o1],
      YB: (t, s) => t.set(s),
      YC: o => o instanceof RegExp,
      YD: x0 => x0.offsetY,
      YE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YF: x0 => x0.height,
      YG: (x0,x1) => { x0.value = x1 },
      YH: (a, l) => a.length = l,
      YI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YJ: x0 => x0.height,
      YK: (x0,x1,x2) => new ImageData(x0,x1,x2),
      YL: () => globalThis.isPwaInstallAvailable(),
      YM: x0 => x0.value,
      YN: (x0,x1) => x0.observe(x1),
      YO: x0 => x0.length,
      YP: (x0,x1) => { x0.nonce = x1 },
      YQ: x0 => x0.projectId,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: (string, times) => string.repeat(times),
      ZD: x0 => x0.offsetX,
      ZE: x0 => new window.FinalizationRegistry(x0),
      ZF: x0 => x0.width,
      ZG: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      ZH: () => new WeakMap(),
      ZI: x0 => x0.body,
      ZJ: x0 => x0.width,
      ZK: (x0,x1) => x0.getContext(x1),
      ZL: (x0,x1) => globalThis.dmovelDownloadAsset(x0,x1),
      ZM: x0 => x0.openCursor(),
      ZN: x0 => x0.height,
      ZO: (x0,x1) => x0.removeItem(x1),
      ZP: x0 => x0.nonce,
      ZQ: x0 => x0.name,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.dotAll,
      aD: x0 => x0.type,
      aE: (x0,x1) => x0.unregister(x1),
      aF: x0 => x0.clientHeight,
      aG: x0 => x0.value,
      aH: (x0,x1) => x0.getRandomValues(x1),
      aI: () => globalThis.document,
      aJ: x0 => x0.rasterEndMilliseconds,
      aK: (x0,x1) => new OffscreenCanvas(x0,x1),
      aL: () => globalThis.isPwaInstalled(),
      aM: (x0,x1) => x0.openCursor(x1),
      aN: x0 => x0.width,
      aO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      aP: (x0,x1) => { x0.src = x1 },
      aQ: x0 => x0.message,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: x0 => x0.unicode,
      bD: x0 => x0.maxTouchPoints,
      bE: (x0,x1) => x0.contains(x1),
      bF: x0 => x0.clientWidth,
      bG: x0 => x0.selectionDirection,
      bH: () => globalThis.crypto,
      bI: () => globalThis.window._flutter_skwasmInstance,
      bJ: x0 => x0.rasterStartMilliseconds,
      bK: x0 => x0.allocationSize(),
      bL: x0 => x0.message,
      bM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      bN: x0 => x0.contentRect,
      bO: (x0,x1,x2) => x0.addEventListener(x1,x2),
      bP: (x0,x1) => { x0.defer = x1 },
      bQ: x0 => x0.code,
      c: o => o,
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: x0 => x0.ignoreCase,
      cD: x0 => x0.platform,
      cE: (s) => +s,
      cF: (x0,x1) => { x0.content = x1 },
      cG: x0 => x0.selectionStart,
      cH: l => new DataView(new ArrayBuffer(l)),
      cI: () => globalThis.window.flutterCanvasKit,
      cJ: x0 => x0.imageBitmaps,
      cK: (x0,x1) => x0.copyTo(x1),
      cL: x0 => x0.name,
      cM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      cN: x0 => x0.addedNodes,
      cO: x0 => ({name: x0}),
      cP: (x0,x1) => { x0.async = x1 },
      cQ: x0 => x0.name,
      d: (o, p) => o[p],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.multiline,
      dD: x0 => x0.body,
      dE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      dF: (x0,x1) => { x0.name = x1 },
      dG: x0 => x0.selectionEnd,
      dH: x0 => x0.abort(),
      dI: () => globalThis.globalThis,
      dJ: x0 => x0.canvasKitMaximumSurfaces,
      dK: (x0,x1) => x0.toDataURL(x1),
      dL: x0 => x0.close(),
      dM: x0 => x0.continue(),
      dN: x0 => x0.firstElementChild,
      dO: (x0,x1) => x0.query(x1),
      dP: () => globalThis.console,
      dQ: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      e: () => globalThis,
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (string, token) => string.split(token),
      eD: () => globalThis.document,
      eE: s => s.trim(),
      eF: x0 => x0.head,
      eG: x0 => x0.value,
      eH: (a, i) => a.splice(i, 1),
      eI: x0 => x0.remove(),
      eJ: x0 => x0.debugSkipFontRetryDelay,
      eK: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      eL: (x0,x1) => x0.postMessage(x1),
      eM: x0 => x0.primaryKey,
      eN: () => globalThis.dmovelSubmitAutofillForm(),
      eO: x0 => x0.state,
      eP: x0 => x0.trustedTypes,
      eQ: (x0,x1) => globalThis.firebase_core.initializeApp(x0,x1),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: o => o instanceof Array,
      fD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      fE: x0 => x0.classList,
      fF: (x0,x1) => x0.removeChild(x1),
      fG: x0 => x0.selectionDirection,
      fH: (map, o) => map.get(o),
      fI: (x0,x1) => x0.querySelectorAll(x1),
      fJ: x0 => new Uint8Array(x0),
      fK: x0 => x0.displayHeight,
      fL: x0 => new BroadcastChannel(x0),
      fM: x0 => x0.delete(),
      fN: (x0,x1) => globalThis.dmovelStoreCredential(x0,x1),
      fO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fP: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      fQ: x0 => x0.storageBucket,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: o => o instanceof Uint16Array,
      gC: (a, i) => a[i],
      gD: x0 => x0.hasFocus(),
      gE: x0 => x0.preventDefault(),
      gF: x0 => x0.firstChild,
      gG: x0 => x0.selectionStart,
      gH: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      gI: (x0,x1) => x0.item(x1),
      gJ: (x0,x1,x2) => x0.set(x1,x2),
      gK: x0 => x0.format,
      gL: (x0,x1) => x0.put(x1),
      gM: x0 => x0.openCursor(),
      gN: (x0,x1) => globalThis.dmovelSetAutofillValues(x0,x1),
      gO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gP: x0 => { globalThis.onGoogleLibraryLoad = x0 },
      gQ: x0 => x0.databaseURL,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: a => a.length,
      hD: x0 => x0.relatedTarget,
      hE: x0 => x0.parent,
      hF: x0 => x0.viewConstraints,
      hG: x0 => x0.selectionEnd,
      hH: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      hI: x0 => x0.length,
      hJ: x0 => x0.buffer,
      hK: x0 => x0.displayWidth,
      hL: (x0,x1,x2) => x0.put(x1,x2),
      hM: (x0,x1) => { x0.onmessage = x1 },
      hN: () => globalThis.dmovelStopAutofill(),
      hO: (x0,x1,x2) => x0.getCurrentPosition(x1,x2),
      hP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hQ: x0 => x0.apiKey,
      i: (l, r) => l === r,
      iB: o => o instanceof Int16Array,
      iC: (x0,x1) => x0.test(x1),
      iD: x0 => x0.shiftKey,
      iE: x0 => x0.timeStamp,
      iF: x0 => x0.hostElement,
      iG: x0 => x0.keyCode,
      iH: () => new AbortController(),
      iI: () => globalThis.Sentry.close(),
      iJ: x0 => x0.wasmMemory,
      iK: (x0,x1) => x0.revokeObjectURL(x1),
      iL: x0 => x0.getTime(),
      iM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      iN: () => globalThis.dmovelGetCredential(),
      iO: () => globalThis.Notification.requestPermission(),
      iP: (x0,x1) => x0.prompt(x1),
      iQ: x0 => x0.options,
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: x0 => x0.userAgent,
      jD: (decoder, codeUnits) => decoder.decode(codeUnits),
      jE: (x0,x1) => x0.hasAttribute(x1),
      jF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jG: (x0,x1) => x0.scrollIntoView(x1),
      jH: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      jI: (o, p, v) => o[p] = v,
      jJ: () => globalThis.window._flutter_skwasmInstance,
      jK: (x0,x1) => { x0.src = x1 },
      jL: x0 => globalThis.Object.keys(x0),
      jM: x0 => x0.data,
      jN: x0 => globalThis.dmovelCredentialId(x0),
      jO: x0 => ({video: x0}),
      jP: x0 => x0.isSkippedMoment(),
      jQ: () => globalThis.firebase_core.getApp(),
      k: o => o,
      kB: o => o instanceof Uint8ClampedArray,
      kC: x0 => x0.navigator,
      kD: () => new TextDecoder("utf-8", {fatal: true}),
      kE: x0 => x0.buttons,
      kF: x0 => ({runApp: x0}),
      kG: x0 => x0.multiViewEnabled,
      kH: (x0,x1) => globalThis.fetch(x0,x1),
      kI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      kJ: x0 => x0.fontFallbackBaseUrl,
      kK: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      kL: x0 => globalThis.Object.getPrototypeOf(x0),
      kM: (x0,x1,x2) => x0.open(x1,x2),
      kN: x0 => globalThis.dmovelCredentialPassword(x0),
      kO: (x0,x1) => x0.getUserMedia(x1),
      kP: x0 => x0.getDismissedReason(),
      kQ: () => globalThis.firebase_core.SDK_VERSION,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: Function.prototype.call.bind(String.prototype.toLowerCase),
      lD: () => new TextDecoder("utf-8", {fatal: false}),
      lE: x0 => x0.ctrlKey,
      lF: (handle) => clearInterval(handle),
      lG: (x0,x1) => x0.replaceWith(x1),
      lH: (x0,x1) => x0.get(x1),
      lI: x0 => globalThis.Sentry.init(x0),
      lJ: (x0,x1,x2) => x0.slice(x1,x2),
      lK: x0 => x0.naturalHeight,
      lL: (o, a) => o === a,
      lM: (x0,x1) => x0.open(x1),
      lN: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      lO: x0 => x0.getVideoTracks(),
      lP: x0 => x0.isDismissedMoment(),
      lQ: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: Object.is,
      mD: (a, i, v) => a[i] = v,
      mE: x0 => x0.y,
      mF: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      mG: (x0,x1) => { x0.type = x1 },
      mH: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      mI: () => new Sentry.getClient(),
      mJ: (x0,x1) => x0.decode(x1),
      mK: x0 => x0.naturalWidth,
      mL: () => globalThis.Object.prototype,
      mM: x0 => x0.name,
      mN: () => globalThis.dmovelInitAutofill(),
      mO: x0 => x0.stop(),
      mP: (x0,x1) => x0.initialize(x1),
      mQ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.vendor,
      nD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      nE: x0 => x0.x,
      nF: () => Date.now(),
      nG: (x0,x1) => { x0.className = x1 },
      nH: (x0,x1) => x0.forEach(x1),
      nI: x0 => x0.getOptions(),
      nJ: (x0,x1) => x0.adoptText(x1),
      nK: x0 => x0.decode(),
      nL: x0 => x0.length,
      nM: (x0,x1) => ({unique: x0,multiEntry: x1}),
      nN: () => globalThis.dmovelGetPendingAutofill(),
      nO: x0 => x0.active,
      nP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      nQ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: (x0,x1) => x0.createTextNode(x1),
      oD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      oE: x0 => x0.scrollTop,
      oF: (x0,x1) => x0.requestAnimationFrame(x1),
      oG: (x0,x1) => { x0.tabIndex = x1 },
      oH: x0 => x0.name,
      oI: (x0,x1) => { x0.name = x1 },
      oJ: x0 => x0.first(),
      oK: (x0,x1) => { x0.decoding = x1 },
      oL: (o, t) => typeof o === t,
      oM: (x0,x1,x2,x3) => x0.createIndex(x1,x2,x3),
      oN: x0 => x0.password,
      oO: x0 => ({audio: x0}),
      oP: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9,x10,x11,x12,x13,x14,x15,x16) => ({client_id: x0,auto_select: x1,callback: x2,login_uri: x3,native_callback: x4,cancel_on_tap_outside: x5,prompt_parent_id: x6,nonce: x7,context: x8,state_cookie_domain: x9,ux_mode: x10,allowed_parent_origin: x11,intermediate_iframe_close_callback: x12,itp_support: x13,login_hint: x14,hd: x15,use_fedcm_for_prompt: x16}),
      oQ: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: (x0,x1) => { x0.id = x1 },
      pD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      pE: x0 => x0.offsetTop,
      pF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pG: (x0,x1) => { x0.name = x1 },
      pH: x0 => x0.statusText,
      pI: (x0,x1) => { x0.sdk = x1 },
      pJ: x0 => x0.next(),
      pK: (x0,x1) => { x0.crossOrigin = x1 },
      pL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pM: (x0,x1) => ({keyPath: x0,autoIncrement: x1}),
      pN: x0 => x0.email,
      pO: x0 => x0.getAudioTracks(),
      pP: x0 => x0.error,
      pQ: (x0,x1) => x0.createScriptURL(x1),
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: (x0,x1) => { x0.nonce = x1 },
      qD: x0 => x0.visibilityState,
      qE: x0 => x0.scrollLeft,
      qF: x0 => x0.now(),
      qG: (x0,x1) => { x0.placeholder = x1 },
      qH: x0 => x0.url,
      qI: x0 => x0.sdk,
      qJ: x0 => x0.current(),
      qK: (x0,x1) => x0.createObjectURL(x1),
      qL: (x0,x1) => { x0.onerror = x1 },
      qM: (x0,x1,x2) => x0.createObjectStore(x1,x2),
      qN: x0 => { globalThis.onDmovelAutofillChanged = x0 },
      qO: x0 => x0.permissions,
      qP: x0 => x0.credential,
      qQ: (x0,x1,x2) => x0.createScript(x1,x2),
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: x0 => x0.nonce,
      rD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      rE: x0 => x0.offsetLeft,
      rF: x0 => x0.performance,
      rG: (x0,x1) => { x0.autocomplete = x1 },
      rH: x0 => x0.status,
      rI: () => globalThis.Sentry.globalHandlersIntegration(),
      rJ: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      rK: x0 => x0.URL,
      rL: x0 => x0.message,
      rM: x0 => x0.oldVersion,
      rN: x0 => x0.input,
      rO: x0 => x0.geolocation,
      rP: x0 => x0.disableAutoSelect(),
      rQ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: () => globalThis.window.flutterConfiguration,
      sD: x0 => x0.disconnect(),
      sE: x0 => x0.offsetParent,
      sF: () => typeof dartUseDateNowForTicks !== "undefined",
      sG: (x0,x1) => { x0.name = x1 },
      sH: x0 => x0.getReader(),
      sI: () => globalThis.Sentry.dedupeIntegration(),
      sJ: x0 => x0.v8BreakIterator,
      sK: x0 => new Blob(x0),
      sL: x0 => x0.error,
      sM: x0 => x0.target,
      sN: x0 => x0.hostElement,
      sO: x0 => x0.mediaDevices,
      sP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      sQ: (o, p) => delete o[p],
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: (x0,x1) => x0.attachShadow(x1),
      tD: x0 => new Intl.Locale(x0),
      tE: (o, p, r) => o.replace(p, () => r),
      tF: () => Date.now(),
      tG: (x0,x1) => { x0.placeholder = x1 },
      tH: x0 => x0.read(),
      tI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      tJ: () => globalThis.Intl,
      tK: x0 => x0.close(),
      tL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      tM: (x0,x1) => x0.deleteDatabase(x1),
      tN: x0 => x0.location,
      tO: x0 => x0.close(),
      tP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      tQ: (x0,x1) => { x0.text = x1 },
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.createElement(x1),
      uD: x0 => x0.region,
      uE: (o, p, r) => o.replaceAll(p, () => r),
      uF: () => 1000 * performance.now(),
      uG: (x0,x1) => { x0.action = x1 },
      uH: x0 => x0.value,
      uI: x0 => ({createScriptURL: x0}),
      uJ: (x0,x1) => x0.segment(x1),
      uK: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      uL: (x0,x1) => { x0.onsuccess = x1 },
      uM: x0 => x0.indexedDB,
      uN: (x0,x1) => x0.getModifierState(x1),
      uO: () => globalThis.PasskeyAuthenticator.init(),
      uP: (x0,x1,x2) => ({enableHighAccuracy: x0,timeout: x1,maximumAge: x2}),
      uQ: (x0,x1) => { x0.text = x1 },
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.scale,
      vD: x0 => x0.script,
      vE: x0 => x0.deltaMode,
      vF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      vG: (x0,x1) => { x0.method = x1 },
      vH: x0 => x0.done,
      vI: (x0,x1,x2) => x0.createPolicy(x1,x2),
      vJ: x0 => x0.index,
      vK: (x0,x1) => x0.decode(x1),
      vL: x0 => x0.result,
      vM: x0 => x0.decode(),
      vN: x0 => x0.metaKey,
      vO: (x0,x1) => x0[x1],
      vP: (x0,x1,x2,x3) => x0.getCurrentPosition(x1,x2,x3),
      vQ: x0 => x0.trustedTypes,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.visualViewport,
      wD: x0 => x0.language,
      wE: x0 => x0.deltaY,
      wF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      wG: (x0,x1) => { x0.noValidate = x1 },
      wH: x0 => x0.cancel(),
      wI: (x0,x1,x2) => x0.createScriptURL(x1,x2),
      wJ: x0 => x0.next(),
      wK: x0 => x0.duration,
      wL: x0 => new Date(x0),
      wM: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      wN: x0 => x0.altKey,
      wO: x0 => globalThis.PasskeyAuthenticator.login(x0),
      wP: x0 => x0.message,
      wQ: (x0,x1) => { x0.type = x1 },
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.devicePixelRatio,
      xD: x0 => x0.languages,
      xE: x0 => x0.deltaX,
      xF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      xG: (x0,x1) => x0.removeAttribute(x1),
      xH: x0 => x0.body,
      xI: x0 => x0.hasChildNodes(),
      xJ: x0 => x0.value,
      xK: x0 => x0.image,
      xL: (x0,x1) => x0.add(x1),
      xM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      xN: x0 => x0.ctrlKey,
      xO: x0 => globalThis.PasskeyAuthenticator.register(x0),
      xP: x0 => x0.code,
      xQ: x0 => x0.maxTouchPoints,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.height,
      yD: (x0,x1) => x0.observe(x1),
      yE: x0 => x0.wheelDeltaY,
      yF: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      yG: x0 => x0.isConnected,
      yH: x0 => x0.headers,
      yI: (x0,x1,x2) => x0.insertBefore(x1,x2),
      yJ: x0 => x0.done,
      yK: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      yL: (x0,x1) => x0.delete(x1),
      yM: (x0,x1,x2) => x0.addEventListener(x1,x2),
      yN: x0 => x0.isComposing,
      yO: () => globalThis.PasskeyAuthenticator.cancelCurrentAuthenticatorOperation(),
      yP: x0 => x0.speed,
      yQ: x0 => x0.hardwareConcurrency,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.width,
      zD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      zE: x0 => x0.wheelDeltaX,
      zF: x0 => x0.history,
      zG: x0 => x0.click(),
      zH: x0 => x0.signal,
      zI: (x0,x1) => x0.append(x1),
      zJ: (o, m, a) => o[m].apply(o, a),
      zK: x0 => new window.ImageDecoder(x0),
      zL: (x0,x1) => globalThis.IDBKeyRange.lowerBound(x0,x1),
      zM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      zN: x0 => x0.code,
      zO: x0 => x0.baseURI,
      zP: x0 => x0.heading,
      zQ: x0 => x0.vendorSub,

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="9394d120-795f-5351-9d04-92cf4a4ed099")}catch(e){}}();
//# debugId=9394d120-795f-5351-9d04-92cf4a4ed099
