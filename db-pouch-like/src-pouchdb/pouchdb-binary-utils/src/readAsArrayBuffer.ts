/** simplified API using `FileReader`.
 * universal browser support is assumed
 */
function readAsArrayBuffer(blob, callback) {
  const reader = new FileReader();
  reader.onloadend = function (e) {
    const result = e.target.result || new ArrayBuffer(0);
    callback(result);
  };
  reader.readAsArrayBuffer(blob);
}

export default readAsArrayBuffer;
