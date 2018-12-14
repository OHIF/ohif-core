// These should be overridden by the implementation
let user = {
  schema: null,
  userLoggedIn: () => false,
  getUserId: () => null,
  getName: () => null,
  getAccessToken: () => null,
  login: () => new Promise((resolve, reject) => reject()),
  logout: () => new Promise((resolve, reject) => reject()),
  getData: key => null,
  setData: (key, value) => null,
  validate: () => null,
}

export default user;
