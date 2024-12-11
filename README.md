# 404finder

指定したリンクに存在するすべてのリンクのうち、404のページを探せる
※サイト全体を確認するわけではなく、あくまでも指定したページだけ

## TODO

- [ ] 許可ドメインの指定を複数できるようにする
- [ ] 複数リンクを指定できるようにする

## setup

```
npm install
ALLOWED_DOMAIN='example.com' TARGET_URL='https://example.com' node check_links.js
```
