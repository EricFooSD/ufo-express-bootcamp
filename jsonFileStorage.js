import { readFile, writeFile } from 'fs';

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {object} jsonContentObj - The content to write to the JSON file
 * @param {function} callback - The callback function to execute on error or success
 * Callback takes write error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
export function write(filename, jsonContentObj, callback) {
  const jsonContentStr = JSON.stringify(jsonContentObj);

  writeFile(filename, jsonContentStr, (writeErr) => {
    if (writeErr) {
      console.error('Write error', jsonContentStr, writeErr);
      callback(writeErr, null);
      return;
    }
    console.log('Write success!');
    callback(null, jsonContentStr);
  });
}

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {function} callback - The callback function to execute on error or success
 * Callback takes read error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
export function read(filename, callback) {
  const handleFileRead = (readErr, jsonContentStr) => {
    if (readErr) {
      console.error('Read error', readErr);
      callback(readErr, null);
      return;
    }
    const jsonContentObj = JSON.parse(jsonContentStr);

    callback(null, jsonContentObj);
  };

  // Read content from DB
  readFile(filename, 'utf-8', handleFileRead);
}

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {function} callback - The callback function to execute on error or success
 * Callback takes read error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
export function edit(filename, readCallback, writeCallback) {
  read(filename, (readErr, jsonContentObj) => {
    if (readErr) {
      console.error('Read error', readErr);
      readCallback(readErr, null);
      return;
    }

    readCallback(null, jsonContentObj);

    write(filename, jsonContentObj, writeCallback);
  });
}

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {string} key - The key in the JSON file whose value is the target array
 * @param {string} input - The value to append to the target array
 * @param {function} callback - The callback function to execute on error or success
 * Callback takes read or write error as 1st param and written string as 2nd param.
 * @returns undefined
 */
export function add(filename, key, input, callback) {
  edit(
    filename,
    (err, jsonContentObj) => {
      if (err) {
        console.error('Edit error', err);
        callback(err);
        return;
      }

      if (!(key in jsonContentObj)) {
        console.error('Key does not exist');
        callback('Key does not exist');
        return;
      }

      jsonContentObj[key].push(input);
    },
    callback,
  );
}
