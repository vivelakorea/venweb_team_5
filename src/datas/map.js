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

const randomizer = (mapList) => {
    const randomNr = Math.random();
    let pickedMap;
    let threshold = 0;
  
    for (let i=0; i<mapList.length; i++) {
      if (mapList[i].probability === '*') {
        continue;
      }
      threshold += mapList[i].probability;
      if (threshold > randomNr) {
        pickedMap = mapList[i].type;
        break;
      }
      if (!pickedMap) {
        pickedMap = mapList.filter((type) => type.probability === '*');
      }
    }
  
    return pickedMap;
};


for (let j=0; j<10; j++) {
  for (let i=0; i<10; i++) {
    let feasiblePoint = [];
    if (j===0) {
      if (i===0) {
        feasiblePoint = [0, 1, 1, 0];
      } else if (i>0&&i<9) {
        feasiblePoint = [0, 1, 1, 1];
      } else {
        feasiblePoint = [0, 0, 1, 1];
      }
    } else if (j>0&&j<9) {
      if (i===0) {
        feasiblePoint = [1, 1, 1, 0];
      } else if (i>0&&i<9) {
        feasiblePoint = [1, 1, 1, 1];
      } else {
        feasiblePoint = [1, 0, 1, 1];
      }
    } else {
      if (i===0) {
        feasiblePoint = [1, 1, 0, 0];
      } else if (i>0&&i<9) {
        feasiblePoint = [1, 1, 0, 1];
      } else {
        feasiblePoint = [1, 0, 0, 1];
      }
    }
    const partialMap = randomizer(mapList);
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
              { "type": "battle", "monster": 1, "percent": 70},
              { "type": "item", "item": 1, "percent": 30},
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
              { "type": "battle", "monster": 1, "percent": 30},
              { "type": "item", "item": 1, "percent": 70},
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
