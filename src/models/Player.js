const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  name: String,
  key: String,

  level: {type: Number, default: 1},
  exp: {type: Number, default: 0},
  maxExp: {type: Number, default: 100},

  maxHP: {type: Number, default: 10},
  HP: {type: Number, default: 10},
  str: {type: Number, default: 5},
  def: {type: Number, default: 5},
  x: {type: Number, default: 0},
  y: {type: Number, default: 0},

  items: {type: [String], default: []},
});

schema.methods.incrementHP = function(val) {
  const hp = this.HP + val;
  this.HP = Math.min(Math.max(0, hp), this.maxHP);
};

schema.methods.death = function() {
  this.hp = 0;
  this.exp = 0;
  this.x = 0;
  this.y = 0;
};

schema.methods.incrementExp = function(val) {
  const exp = this.exp + val;
  if (exp >= this.maxExp) {
    this.level += parseInt(exp / this.maxExp);
    this.exp = exp % this.maxExp;
    this.maxExp += 10;
  } else {
    this.exp = exp;
  }
};

schema.methods.getItem = function(item) {
  const itemList = this.items;
  if (!itemList.includes(item)) {
    itemList.push(item);
    this.items = itemList;
    return true; // 획득에 성공
  } else return false; // 획득에 실패
};

const Player = mongoose.model('Player', schema);

module.exports = {
  Player,
};
