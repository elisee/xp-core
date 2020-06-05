"use strict";

document.addEventListener("keydown", (event) => {
  // Prevent accidental back navigations in Firefox (use Alt+Left instead!)
  if (event.code === "Backspace") {
    if ((event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") &&
      !event.target.disabled && !event.target.readOnly) return;

    event.preventDefault();
  }
});

const $ = (first, second) => {
  if (typeof first === "string") return document.querySelector(first);
  else if (second != null) return first.querySelector(second);
  return first;
};

const $$ = (first, second) => {
  if (typeof first === "string") return document.querySelectorAll(first);
  else return first.querySelectorAll(second);
};

function $make(tagName, parent, props) {
  const elt = document.createElement(tagName);
  if (parent != null) parent.appendChild(elt);
  for (const key in props) {
    if (key === "dataset") {
      for (const dataKey in props[key]) elt.dataset[dataKey] = props.dataset[dataKey];
    } else elt[key] = props[key];
  }
  return elt;
}

function $makeText(text, parent) {
  const node = document.createTextNode(text);
  if (parent != null) parent.appendChild(node);
  return node;
}

function $show(elt, visible) { $(elt).hidden = visible != null ? !visible : false; }
function $hide(elt) { $(elt).hidden = true; }

// Trigger a layout to help with transitions
function $layout(elt) { $(elt).offsetLeft; }
