const thisAtob = function (str: string) {
  return atob(str);
};

const thisBtoa = function (str: string) {
  return btoa(str);
};

export { thisAtob as atob, thisBtoa as btoa };
