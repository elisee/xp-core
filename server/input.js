"use strict";

exports.validate = {
  integer: (value, min, max) => {
    if (!Number.isInteger(value)) return false;
    if (min != null && value < min) return false;
    if (max != null && value > max) return false;
    return true;
  },

  string: (value, minLength, maxLength) => {
    if (typeof value !== "string") return false;
    if (minLength != null && value.length < minLength) return false;
    if (maxLength != null && value.length > maxLength) return false;
    return true;
  },

  regex: (value, regex) => {
    if (typeof value !== "string") return false;
    return regex.test(value);
  },

  boolean: (value) => typeof value === "boolean",
  function: (value) => typeof value === "function"
};

exports.regexes = {
  nodeId: /^[a-z]{2,20}$/,
  nickname: /^.{2,20}$/,
  roomCode: /^[A-Z]{4}$/,
  userToken: /^[A-Za-z0-9+-]{16}$/,
  roomName: /^.{2,30}$/,
  dateText: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
exports.escapeForRegExp = (string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
