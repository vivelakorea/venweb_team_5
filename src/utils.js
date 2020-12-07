const findById = (i, arr) => {
  // array 안의 object들 중 특정 id 가진 object 찾아서 리턴
  let res = null;
  arr.forEach((e) => {
    if (Number(e.id) === Number(i)) res = e;
  });
  if (!res) throw new Error('wrong id');
  return res;
};

module.exports = {findById};
