const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./kiosk.db');

function mergeProducts(productIds, newName) {
  if (!Array.isArray(productIds) || productIds.length < 2) {
    console.error('Нужно передать минимум два ID товара для объединения.');
    return;
  }

  const primaryId = productIds[0];         // основной товар – параметры (цена, фото, категория) остаются его
  const mergingIds = productIds.slice(1);    // остальные товары, данные которых будут объединены

  db.serialize(() => {
    // Начало транзакции
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) {
        console.error("Ошибка начала транзакции:", err.message);
        return;
      }
    });

    // 1. Обновляем основной товар – меняем имя на новое
    db.run(
      "UPDATE products SET name = ? WHERE id = ?",
      [newName, primaryId],
      function(err) {
        if (err) {
          console.error("Ошибка обновления основного товара:", err.message);
          return db.run("ROLLBACK");
        }
      }
    );

    // 2. Обновляем записи в таблице prices для объединяемых товаров.
    mergingIds.forEach((mergingId) => {
      db.run(
        "UPDATE OR IGNORE prices SET product_id = ? WHERE product_id = ?",
        [primaryId, mergingId],
        function(err) {
          if (err) {
            console.error(`Ошибка обновления prices для товара ${mergingId}:`, err.message);
            return db.run("ROLLBACK");
          }
        }
      );
    });

    // 3. Объединяем данные продаж (sales).
    const placeholders = mergingIds.map(() => '?').join(', ');
    const mergeSalesQuery = `
      INSERT INTO sales (date, product_id, quantity, sale_type, order_number)
      SELECT date, ?, SUM(quantity) AS quantity, sale_type, order_number
      FROM sales
      WHERE product_id IN (${placeholders})
      GROUP BY date, order_number, sale_type
      ON CONFLICT(date, product_id, order_number) DO UPDATE SET quantity = sales.quantity + excluded.quantity;
    `;
    const mergeSalesParams = [primaryId, ...mergingIds];
    db.run(mergeSalesQuery, mergeSalesParams, function(err) {
      if (err) {
        console.error("Ошибка объединения продаж:", err.message);
        return db.run("ROLLBACK");
      }
    });

    // Удаляем старые записи продаж для объединяемых товаров, т.к. они уже перенесены и агрегированы.
    const deleteSalesQuery = `DELETE FROM sales WHERE product_id IN (${placeholders})`;
    db.run(deleteSalesQuery, mergingIds, function(err) {
      if (err) {
        console.error("Ошибка удаления объединяемых записей продаж:", err.message);
        return db.run("ROLLBACK");
      }
    });

    // 4. Удаляем объединяемые товары из таблицы products.
    const deleteProductsQuery = `DELETE FROM products WHERE id IN (${placeholders})`;
    db.run(deleteProductsQuery, mergingIds, function(err) {
      if (err) {
        console.error("Ошибка удаления объединяемых товаров:", err.message);
        return db.run("ROLLBACK");
      }
    });

    // Фиксируем транзакцию
    db.run("COMMIT", (err) => {
      if (err) {
        console.error("Ошибка фиксации транзакции:", err.message);
        return db.run("ROLLBACK");
      }
      console.log("Объединение товаров выполнено успешно.");
    });
  });
}


// mergeProducts([12, 13, 14, 15, 16, 17], "Corny");
// mergeProducts([9, 10, 11, 79], "Bruschette");
// mergeProducts([20, 21, 22], "Oreo");
// mergeProducts([23, 24, 25], "Chocolate Roshen");
// mergeProducts([26, 27, 28, 29], "Doshirak");
// mergeProducts([33, 34], "Popcorn");
// mergeProducts([91, 49, 48, 44, ], "Gumi");
// mergeProducts([45, 46, 47], "Gumi slice");
// mergeProducts([56, 57, 58, 59, 60, 61], "Milka");
// mergeProducts([41, 42], "Bueno");
// mergeProducts([], "");
// mergeProducts([], "");
// mergeProducts([], "");


