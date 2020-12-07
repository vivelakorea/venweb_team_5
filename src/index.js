const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const crypto = require('crypto');
const morgan = require('morgan');
const {body, validationResult} = require('express-validator');

const {constantManager, mapManager, eventManager, monsterManager} = require('./datas/Manager');
const {Player} = require('./models/Player');

const app = express();
app.use(morgan('dev'));
app.use(express.urlencoded({extended: true}));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

mongoose.connect(
    'mongodb+srv://venweb5:venweb5@cluster0.xttdc.mongodb.net/Cluster0?retryWrites=true&w=majority',
    {useNewUrlParser: true, useUnifiedTopology: true},
);

const authentication = async (req, res, next) => {
  const {authorization} = req.headers;
  if (!authorization) return res.sendStatus(401);
  const [bearer, key] = authorization.split(' ');
  if (bearer !== 'Bearer') return res.sendStatus(401);
  const player = await Player.findOne({key});
  if (!player) return res.sendStatus(401);

  req.player = player;
  next();
};

app.get('/', (req, res) => {
  res.render('index', {gameName: constantManager.gameName});
});

app.get('/game', (req, res) => {
  res.render('game');
});

app.post('/signup', [
  body('name').isLength({min: 4, max: 12}),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error(errors);
    res.status(400).send(errors);
  }

  const {name} = req.body;

  if (await Player.exists({name})) {
    return res.status(400).send({error: 'Player already exists'});
  }

  const player = new Player({
    name,
    maxHP: 10,
    // HP: 10,
    HP: 2,
    str: 5,
    def: 5,
    x: 0,
    y: 0,
  });

  const key = crypto.randomBytes(24).toString('hex');
  player.key = key;

  await player.save();

  return res.send({key});
});

app.post('/action', authentication, async (req, res) => {
  const {action} = req.body;
  const player = req.player;
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


        // 배틀들 중 랜덤한 배틀 발생
        const random = Math.floor(Math.random() * battles.length);
        const battle = battles[random];
        const monster = monsters[random]; // 얘도 battles.length로 처리해도 되나요?

        const monsterOrinigalHP = monster.hp; // 다시 같은 몬스터와 전투시 이미 hp가 0인 문제 해결


        event = {description: battle.description};
        let turn = 'player';
        while (true) {
          if (player.HP <= 0) {
            event.description += ' -> 죽었다. 평원의 시작점에서 부활'; // TODO: 0,0 으로 보내기
            await player.save();
            res.send({player, field, event});
            player.x = 0;
            player.y = 0;
            player.HP = 10;
            await player.save();
            break;

          } else if (monster.hp <= 0) {
            event.description += ' -> 죽였다.';
            monster.hp = monsterOrinigalHP;
            break;
          } else {
            // 데미지는 한번에 1씩만 넣는걸로
            // 공격하는측 str이 높을수록 확률 높아짐
            // 공격당하는측 def가 높을수록 확률 낮아짐
            if (turn === 'player') {
              const attackProbability = player.str / monster.def;
              if (Math.random() < attackProbability) {
                monster.hp -= 1;
                event.description += ` -> ${turn}가 공격에 성공, 플레이어 체력: ${player.HP} / 몬스터 체력: ${monster.hp}`;
              } else {
                event.description += ` -> ${turn}가 공격에 실패, 플레이어 체력: ${player.HP} / 몬스터 체력: ${monster.hp}`;
              }

              turn = 'monster';
            } else if (turn === 'monster') {
              const attackProbability = monster.str / player.def;
              if (Math.random() < attackProbability) {
                player.HP -= 1;
                event.description += ` -> ${turn}가 공격에 성공, 플레이어 체력: ${player.HP} / 몬스터 체력: ${monster.hp}`;
              } else {
                event.description += ` -> ${turn}가 공격에 실패, 플레이어 체력: ${player.HP} / 몬스터 체력: ${monster.hp}`;
              }

              turn = 'player';
            }
          }
        }
      }
    }

    await player.save();
    return res.send({player, field, event});
  }
});

app.listen(3000, () => console.log('listening on port: 3000'));
