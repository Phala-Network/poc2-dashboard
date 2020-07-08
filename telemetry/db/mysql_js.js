const mysql = require('sync-mysql');

const connection = new mysql({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  charset: 'utf8mb4'
});


function execute(sql) {
  //console.log(sql);

  try {
    let result = connection.query(sql);

    return result;
  } catch (err) {
    console.log(err);
    return null;
  }
}

module.exports = { execute }