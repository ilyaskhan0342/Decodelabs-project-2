# Trade Journal API

A small, dependable backend for logging trades and reviewing performance —
built for **Project 2: Backend API Development** (DecodeLabs Full Stack Kit).

No database yet, on purpose: this project is about the API's logic —
endpoints, validation, and honest status codes — not storage. Trades live
in memory and reset when the server restarts.

## Run it

```bash
npm install
npm start          # http://localhost:3000
```

Set a custom port with `PORT=4000 npm start`.

## The resource: `trade`

```json
{
  "id": 1,
  "symbol": "EURUSD",
  "direction": "long",
  "entry": 1.082,
  "exit": 1.0885,
  "qty": 10000,
  "date": "2026-07-01",
  "notes": "Broke out of the range on the London open.",
  "pnl": 65,
  "createdAt": "2026-07-11T15:29:39.350Z",
  "updatedAt": "2026-07-11T15:29:39.350Z"
}
```

`pnl` is always computed server-side from `direction`, `entry`, `exit`, and
`qty` — the client never sends it and can never override it.

## Endpoints

Resources are nouns, methods are verbs — `/api/trades`, not `/api/getTrades`.

| Method | Path                  | Does                                      |
|--------|-----------------------|--------------------------------------------|
| GET    | `/api/health`          | Liveness check                            |
| GET    | `/api/trades`          | List trades (supports filters below)      |
| GET    | `/api/trades/summary`  | Aggregate stats across all trades         |
| GET    | `/api/trades/:id`      | Fetch one trade                           |
| POST   | `/api/trades`          | Create a trade                            |
| PUT    | `/api/trades/:id`      | Update a trade (partial — only send what changed) |
| DELETE | `/api/trades/:id`      | Remove a trade                            |

### Filtering the list

`GET /api/trades?symbol=EURUSD&direction=long&result=win`

- `symbol` — exact match, case-insensitive
- `direction` — `long` or `short`
- `result` — `win` or `loss`

### Creating a trade

```bash
curl -X POST http://localhost:3000/api/trades \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD",
    "direction": "long",
    "entry": 61200,
    "exit": 63550,
    "qty": 0.3,
    "date": "2026-07-09",
    "notes": "Followed the plan."
  }'
```

Required fields: `symbol`, `direction` (`long`|`short`), `entry`, `exit`,
`qty`, `date` (`YYYY-MM-DD`). `notes` is optional, max 500 characters.

### Updating a trade

`PUT` only requires the fields you want to change — anything omitted keeps
its current value:

```bash
curl -X PUT http://localhost:3000/api/trades/3 \
  -H "Content-Type: application/json" \
  -d '{ "exit": 64000 }'
```

## Status codes this API actually uses

| Code | Meaning         | When                                          |
|------|-----------------|------------------------------------------------|
| 200  | OK              | Successful GET or PUT                         |
| 201  | Created         | POST succeeded — `Location` header points to the new trade |
| 204  | No Content      | DELETE succeeded — nothing to return          |
| 400  | Bad Request     | Validation failed or the JSON body is malformed |
| 404  | Not Found       | No trade with that id, or an unknown route    |
| 500  | Internal Error  | Something broke server-side (details are logged, never leaked to the client) |

## Validation: never trust the client

Every write goes through `middleware/validateTrade.js` before it touches the
store. Bad input never reaches business logic:

```bash
curl -X POST http://localhost:3000/api/trades \
  -H "Content-Type: application/json" \
  -d '{ "symbol": "BTCUSD" }'
```

```json
{
  "error": "Validation failed",
  "details": [
    "\"direction\" is required.",
    "\"entry\" is required.",
    "\"exit\" is required.",
    "\"qty\" is required.",
    "\"date\" is required."
  ]
}
```

## Project layout

```
trade-journal-api/
├── server.js               # app setup, middleware, error handling
├── routes/
│   └── trades.js            # the /api/trades endpoints
├── middleware/
│   └── validateTrade.js     # request validation, shared by POST and PUT
├── data/
│   └── tradeStore.js        # in-memory store + P&L math
└── package.json
```

## Try it end to end

1. `npm install && npm start`
2. `curl http://localhost:3000/api/trades` — see the two seeded trades
3. `curl http://localhost:3000/api/trades/summary` — win rate and net P&L
4. POST a new trade, then GET it back by id
5. PUT a correction, then GET again to confirm the P&L recalculated
6. DELETE it and confirm a second DELETE now returns 404
