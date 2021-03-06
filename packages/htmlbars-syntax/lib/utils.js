import { buildText } from "./builders";
import { indexOfArray } from "../htmlbars-util/array-utils";
// Regex to validate the identifier for block parameters. 
// Based on the ID validation regex in Handlebars.

var ID_INVERSE_PATTERN = /[!"#%-,\.\/;->@\[-\^`\{-~]/;

// Checks the component's attributes to see if it uses block params.
// If it does, registers the block params with the program and
// removes the corresponding attributes from the element.

export function parseComponentBlockParams(element, program) {
  var l = element.attributes.length;
  var attrNames = [];

  for (var i = 0; i < l; i++) {
    attrNames.push(element.attributes[i].name);
  }

  var asIndex = indexOfArray(attrNames, 'as');

  if (asIndex !== -1 && l > asIndex && attrNames[asIndex + 1].charAt(0) === '|') {
    // Some basic validation, since we're doing the parsing ourselves
    var paramsString = attrNames.slice(asIndex).join(' ');
    if (paramsString.charAt(paramsString.length - 1) !== '|' || paramsString.match(/\|/g).length !== 2) {
      throw new Error('Invalid block parameters syntax: \'' + paramsString + '\'');
    }

    var params = [];
    for (i = asIndex + 1; i < l; i++) {
      var param = attrNames[i].replace(/\|/g, '');
      if (param !== '') {
        if (ID_INVERSE_PATTERN.test(param)) {
          throw new Error('Invalid identifier for block parameters: \'' + param + '\' in \'' + paramsString + '\'');
        }
        params.push(param);
      }
    }

    if (params.length === 0) {
      throw new Error('Cannot use zero block parameters: \'' + paramsString + '\'');
    }

    element.attributes = element.attributes.slice(0, asIndex);
    program.blockParams = params;
  }
}

// Adds an empty text node at the beginning and end of a program.
// The empty text nodes *between* nodes are handled elsewhere.

export function postprocessProgram(program) {
  var body = program.body;

  if (body.length === 0) {
    return;
  }

  if (usesMorph(body[0])) {
    body.unshift(buildText(''));
  }

  if (usesMorph(body[body.length-1])) {
    body.push(buildText(''));
  }
}

export function childrenFor(node) {
  if (node.type === 'Program') {
    return node.body;
  }
  if (node.type === 'ElementNode') {
    return node.children;
  }
}

export function usesMorph(node) {
  return node.type === 'MustacheStatement' ||
         node.type === 'BlockStatement' ||
         node.type === 'ComponentNode';
}

export function appendChild(parent, node) {
  var children = childrenFor(parent);

  var len = children.length, last;
  if (len > 0) {
    last = children[len-1];
    if (usesMorph(last) && usesMorph(node)) {
      children.push(buildText(''));
    }
  }
  children.push(node);
}

export function isHelper(sexpr) {
  return (sexpr.params && sexpr.params.length > 0) ||
    (sexpr.hash && sexpr.hash.pairs.length > 0);
}
