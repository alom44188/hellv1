/**
 * Internal dependencies.
 */

var syntax = require('./syntax');

/**
 * Context.
 *
 * @param {Object} node
 * @param {Object} parent node
 * @constructor
 */

function Context(node, parentNode, depth) {
  this.node = node;
  this.parent = parentNode;
  this.children = [];
  this._score = 0;
  this._depth = depth;
}

/**
 * Add `num` to the context score.
 *
 * @param {Number} num
 * @api public
 */

Context.prototype.add = function(num) {
  this._score += num;
};

/**
 * Return depth.
 *
 * @returns {Number}
 * @api public
 */

Context.prototype.depth = function() {
  return this._depth;
};

/**
 * Return the score of the context.
 *
 * @returns {Number}
 * @api public
 */

Context.prototype.score = function() {
  return this.children.map(function(child) {
    return child.score();
  }).reduce(function(a, b) {
    return a + b;
  }, this._score);
};

/**
 * Return the context location. If it's a Program node,
 * the location is always 0, otherwise it is node's
 * starting line.
 *
 * @returns {Number}
 * @api public
 */

Context.prototype.location = function() {
  return this.root()
    ? 0
    : this.node.loc.start.line;
};

/**
 * toJSON.
 *
 * @returns {Object}
 * @api public
 */

Context.prototype.toJSON = function() {
  return {
    score: this.score(),
    signature: this.signature(),
    location: this.location()
  };
};

/**
 * Return if the context is Program node or not.
 *
 * @returns {Boolean}
 * @api public
 */

Context.prototype.root = function() {
  return this.node.type === syntax.Program;
};

/**
 * Return context signature.
 *
 * @returns {String}
 * @api public
 */

Context.prototype.signature = function() {
  return this.main()
    || this.named()
    || this.vardec()
    || this.assignment()
    || 'anonymous';
};

/**
 * Return 'main' if the node is Program.
 *
 * @returns {String|undefined}
 * @api private
 */

Context.prototype.main = function() {
  if (this.node.type === syntax.Program) {
    return '*';
  }
};

/**
 * Return the name of a named function.
 *
 * @returns {String|undefined}
 * @api private
 */

Context.prototype.named = function() {
  if (!this.node.id || !this.node.id.name) return;
  return this.node.id.name;
};

/**
 * When the function is a part of variable declaration,
 * return the variable identifier.
 *
 * @returns {String|undefined}
 * @api private
 */

Context.prototype.vardec = function() {
  if (this.parent.type !== syntax.VariableDeclarator) return;
  return this.parent.id.name;
};

/**
 * When the function has been assigned to a variable,
 * return the variable name.
 *
 * @returns {String|undefined}
 * @api private
 */

Context.prototype.assignment = function() {
  if (this.parent.type !== syntax.AssignmentExpression) return;

  var ret = [];
  var left = this.parent.left;

  if (left.name) return left.name;

  (function search(obj) {
    if (obj.object.type === syntax.MemberExpression) {
      search(obj.object);
    } else {
      ret.push(obj.object.name);
    }
    ret.push(obj.property.name || obj.property.value || '?');
  })(left);

  return ret.join('.');
};

/**
 * Primary export.
 */

module.exports = Context;
