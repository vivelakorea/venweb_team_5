/* eslint-disable require-jsdoc */
const fs = require('fs');

class Manager {
  constructor() {}
}

class ConstantManager extends Manager {
  constructor(datas) {
    super();
    this.gameName = datas.gameName;
  }
}

class EventManager extends Manager {
  constructor(datas) {
    super();
    this.battleEvents = datas[0];
    this.itemEvents = datas[1];
  }
}

class MonsterManager extends Manager {
  constructor(datas) {
    super();
    this.monsters = datas;
  }
}

class ItemManager extends Manager {
  constructor(datas) {
    super();
    this.items = datas;
  }
}

class MapManager extends Manager {
  constructor(datas) {
    super();
    this.id = datas.id;
    this.fields = {};

    datas.fields.forEach((field) => {
      this.fields[`${field[0]}_${field[1]}`] = {
        x: field[0],
        y: field[1],
        description: field[2],
        canGo: field[3],
        events: field[4],
      };
    });
  }

  getField(x, y) {
    return this.fields[`${x}_${y}`];
  }
}
const constantManager = new ConstantManager(
    JSON.parse(fs.readFileSync(__dirname + '/constants.json')),
);

const mapManager = new MapManager(
    JSON.parse(fs.readFileSync(__dirname + '/map.json')),
);

const eventManager = new EventManager(
    JSON.parse(fs.readFileSync(__dirname + '/events.json')),
);

const monsterManager = new MonsterManager(
    JSON.parse(fs.readFileSync(__dirname + '/monsters.json')),
);

const itemManager = new ItemManager(
    JSON.parse(fs.readFileSync(__dirname + '/items.json')),
);

module.exports = {
  constantManager,
  mapManager,
  eventManager,
  monsterManager,
  itemManager,
};
