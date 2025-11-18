@echo off
REM 检查数据库表结构
npx wrangler d1 execute philosophy-books-db --command "PRAGMA table_info(books);"