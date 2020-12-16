/* eslint-disable max-len */
const express = require('express');
const crypto = require('crypto');
const morgan = require('morgan');
const dotenv = require('dotenv');
const {body, validationResult} = require('express-validator');

const {constantManager, mapManager, eventManager, monsterManager, itemManager} = require('./datas/Manager');
const {findById} = require('./utils');
const {Player} = require('./models/Player');
const connect = require('./connect');

dotenv.config();
connect();

const app = express();

app.set('port', process.env.PORT || 8000);

app.use(morgan('dev'));
app.use(express.urlencoded({extended: true}));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);


const authentication = async (req, res, next) => {
  try {
    const {authorization} = req.headers;
    if (!authorization) return res.sendStatus(401);
    const [bearer, key] = authorization.split(' ');
    if (bearer !== 'Bearer') return res.sendStatus(401);
    const player = await Player.findOne({key});
    if (!player) return res.sendStatus(401);

    req.player = player;
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

app.get('/', (req, res, next) => {
  try {
    res.render('index', {gameName: constantManager.gameName});
  } catch (err) {
    console.error(err);
    next(err);
  }
});

app.get('/game', (req, res, next) => {
  try {
    res.render('game');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

app.post('/signup', [
  body('name').isLength({min: 4, max: 12}),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('4자 이상 12자 이하의 이름만 입력됩니다');
      error.status = 400;
      return next(error);
    }

    const {name} = req.body;

    if (await Player.exists({name})) {
      const error = new Error('이미 있는 이름입니다');
      error.status = 400;
      return next(error);
    }

    const player = new Player({
      name,
      maxHP: 10,
      HP: 10,
      str: 5,
      def: 5,
      x: 0,
      y: 0,
    });

    const key = crypto.randomBytes(24).toString('hex');
    player.key = key;

    await player.save();

    return res.send({key});
  } catch (err) {
    console.error(err);
    next(err);
  }
});

app.post('/action', authentication, async (req, res, next) => {
  try {
    const {action} = req.body;
    const player = req.player;
    // if(action === 'reroll') {
    //   player.str = Math.floor(Math.random()*5);
    //   player.def = Math.floor(Math.random()*5);
    //   player.reroll -= 1;
    //   if(player.reroll === 0) {
    //     player.status = 1;
    //   }
    //   await player.save();
    //   return res.send(player);
    // }
    let event = null;
    if (action === 'query') {
      const field = mapManager.getField(req.player.x, req.player.y);

      return res.send({player, field});
    } else if (action === 'move') {
      const direction = parseInt(req.body.direction, 0); // 0 북. 1 동 . 2 남. 3 서.
      let x = req.player.x;
      let y = req.player.y;
      if (direction === 0) {
        y -= 1;
      } else if (direction === 1) {
        x += 1;
      } else if (direction === 2) {
        y += 1;
      } else if (direction === 3) {
        x -= 1;
      } else {
        res.sendStatus(400);
      }
      const field = mapManager.getField(x, y);
      if (!field) res.sendStatus(400);
      player.x = x;
      player.y = y;

      const events = field.events;

      if (events.length > 0) {
        const battleProbability = events[0].percent / 100;
        const _event = Math.random() < battleProbability ? events[0] : events[1];
        if (_event.type === 'battle') {
        // TODO: 이벤트 별로 events.json 에서 불러와 이벤트 처리 -> ???
          const battles = eventManager.battleEvents;
          const monsters = monsterManager.monsters;


          const monsterId = field.events[0].monster;
          const battle = findById(monsterId, battles);
          const monster = findById(monsterId, monsters);
          const monsterOrinigalHP = monster.hp; // 다시 같은 몬스터와 전투시 이미 hp가 0인 문제 해결


          event = {description: battle.description};
          let turn = 'player';
          while (true) {
            if (player.HP <= 0) {
              event.description += ' <br /><br /> 죽었다. 평원의 시작점에서 부활'; // TODO: 0,0 으로 보내기
              player.death();
              event.death = true;
              monster.hp = monsterOrinigalHP; // 다시 같은 몬스터와 전투시 이미 hp가 깎여있는 문제 해결
              break;
            } else if (monster.hp <= 0) {
              event.description += ' <br /><br /> 죽였다.';
              player.incrementExp(10*(monster.str + monster.def));
              monster.hp = monsterOrinigalHP; // 다시 같은 몬스터와 전투시 이미 hp가 0인 문제 해결
              break;
            } else {
            // 데미지는 한번에 1씩만 넣는걸로
            // 공격하는측 str이 높을수록 확률 높아짐
            // 공격당하는측 def가 높을수록 확률 낮아짐
              if (turn === 'player') {
                const attackProbability = player.str / monster.def;
                if (Math.random() < attackProbability) {
                  monster.hp -= 1;
                  event.description += ` <br /><br /> ${turn}가 공격에 성공, 플레이어 체력: ${player.HP} / 몬스터 체력: ${monster.hp}`;
                } else {
                  event.description += ` <br /><br /> ${turn}가 공격에 실패, 플레이어 체력: ${player.HP} / 몬스터 체력: ${monster.hp}`;
                }

                turn = 'monster';
              } else if (turn === 'monster') {
                const attackProbability = monster.str / player.def;
                if (Math.random() < attackProbability) {
                  player.HP -= 1;
                  event.description += ` <br /><br />${turn}가 공격에 성공, 플레이어 체력: ${player.HP} / 몬스터 체력: ${monster.hp}`;
                } else {
                  event.description += ` <br /><br /> ${turn}가 공격에 실패, 플레이어 체력: ${player.HP} / 몬스터 체력: ${monster.hp} `;
                }

                turn = 'player';
              }
            }
          }
        } else if (_event.type === 'item') {
          const items = itemManager.items;
          const itemId = field.events[1].item;
          const item = findById(itemId, items);
          if (player.getItem(item.name)) {
            console.log(player.items);
            if (item.str) player.str += item.str;
            else if (item.def) player.def += item.def;
            event = {description: `아이템 획득: ${item.name} / 플레이어 str: ${player.str}, def: ${player.def} `};
          } else {
            console.log(player.items);
            event = {description: `${item.name}을(를) 발견했지만 이미 가지고 있는 아이템이었다.`};
          }
        }
      }

      await player.save();
      return res.send({player, field, event});
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 에러처리반
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // console.log(err);
  console.log(err.message);
  res.send({status: err.status || 500, message: err.message});
  // err에 status를 따로 안먹였으면 500
  // res.status(err.status || 500).send({
  //   error: {message, status: status || 500},
  // });
});

app.listen(app.get('port'), () => console.log(`listening on port: ${app.get('port')}`));
