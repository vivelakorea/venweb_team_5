fs=require('fs');
const map=[];
const startingPoint = '평원의 시작점이다.';
const monsterPoint = '왠지 몬스터가 나올 것 같은 그런 스산한 분위기가 느껴진다.';
const itemPoint = '행운이 찾아올 것 같다.';
const emptyPoint = '아무것도 없다';
const mapList = [
  {type: monsterPoint, probability: 0.3},
  {type: itemPoint, probability: 0.3},
  {type: emptyPoint, probability: 0.4},
];
const itemList = [ // type이 item의 id에 해당
  {type: 1, probability: 0.20},
  {type: 2, probability: 0.20},
  {type: 1000, probability: 0.40},
  {type: 1001, probability: 0.17},
  {type: 1002, probability: 0.03},
];
const monsterList = [ // type이 monster의 id에 해당
  {type: 1, probability: 0.40},
  {type: 2, probability: 0.15},
  {type: 3, probability: 0.12},
  {type: 4, probability: 0.25},
  {type: 5, probability: 0.08},
];

const randomizer = (choiceList) => {
  const randomNr = Math.random();
  let picked;
  let threshold = 0;

  for (let i=0; i<choiceList.length; i++) {
    if (choiceList[i].probability === '*') {
      continue;
    }
    threshold += choiceList[i].probability;
    if (threshold > randomNr) {
      picked = choiceList[i].type;
      break;
    }
    if (!picked) {
      picked = choiceList.filter((type) => type.probability === '*');
    }
  }

  return picked;
};


for (let j=0; j<25; j++) {
  for (let i=0; i<25; i++) {
    let feasiblePoint = [];
    if (j===0) {
      if (i===0) {
        feasiblePoint = [0, 1, 1, 0];
      } else if (i>0&&i<24) {
        feasiblePoint = [0, 1, 1, 1];
      } else {
        feasiblePoint = [0, 0, 1, 1];
      }
    } else if (j>0&&j<24) {
      if (i===0) {
        feasiblePoint = [1, 1, 1, 0];
      } else if (i>0&&i<24) {
        feasiblePoint = [1, 1, 1, 1];
      } else {
        feasiblePoint = [1, 0, 1, 1];
      }
    } else {
      if (i===0) {
        feasiblePoint = [1, 1, 0, 0];
      } else if (i>0&&i<24) {
        feasiblePoint = [1, 1, 0, 1];
      } else {
        feasiblePoint = [1, 0, 0, 1];
      }
    }
    const partialMap = randomizer(mapList);
    const selectedItem = randomizer(itemList);
    const selectedMonster = randomizer(monsterList);
    if (i===0&&j===0) {
      map.push(
          [
            i,
            j,
            startingPoint,
            feasiblePoint,
            [],
          ]);
      continue;
    }
    if (partialMap === monsterPoint) {
      map.push(
          [
            i,
            j,
            partialMap,
            feasiblePoint,
            [
              {'type': 'battle', 'monster': selectedMonster, 'percent': 70},
              {'type': 'item', 'item': selectedItem, 'percent': 30},
            ],
          ]);
      continue;
    } else if (partialMap === itemPoint) {
      map.push(
          [
            i,
            j,
            partialMap,
            feasiblePoint,
            [
              {'type': 'battle', 'monster': selectedMonster, 'percent': 30},
              {'type': 'item', 'item': selectedItem, 'percent': 70},
            ],
          ]);
      continue;
    } else {
      map.push(
          [
            i,
            j,
            partialMap,
            feasiblePoint,
            [],
          ]);
      continue;
    }
  }
}

const mapJson = {
  id: 1,
  fields: map,
};

const mapJsonString = JSON.stringify(mapJson, null, 2);
fs.writeFileSync('map.json', mapJsonString);
