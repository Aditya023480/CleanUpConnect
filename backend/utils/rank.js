function getRankTitle(points) {
  if (points >= 500) {
    return 'Platinum';
  }

  if (points >= 250) {
    return 'Gold';
  }

  if (points >= 100) {
    return 'Silver';
  }

  return 'Bronze';
}

module.exports = {
  getRankTitle,
};
