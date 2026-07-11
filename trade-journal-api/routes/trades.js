"use strict";

const express = require("express");
const router = express.Router();
const store = require("../data/tradeStore");
const validateTrade = require("../middleware/validateTrade");

/**
 * GET /api/trades
 * Optional query params: symbol, direction, result (win|loss)
 */
router.get("/", (req, res) => {
  const { symbol, direction, result } = req.query;
  const trades = store.getAll({ symbol, direction, result });
  res.status(200).json({ count: trades.length, trades });
});

/**
 * GET /api/trades/summary
 * Aggregated stats across all logged trades.
 * NOTE: registered before "/:id" so "summary" isn't parsed as an id.
 */
router.get("/summary", (req, res) => {
  res.status(200).json(store.stats());
});

/**
 * GET /api/trades/:id
 */
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Trade id must be an integer." });
  }

  const trade = store.getById(id);
  if (!trade) {
    return res.status(404).json({ error: `No trade found with id ${id}.` });
  }

  res.status(200).json(trade);
});

/**
 * POST /api/trades
 * Creates a new trade entry.
 */
router.post("/", validateTrade(), (req, res) => {
  const trade = store.create(req.body);
  res
    .status(201)
    .location(`/api/trades/${trade.id}`)
    .json(trade);
});

/**
 * PUT /api/trades/:id
 * Updates an existing trade. Fields not sent are left unchanged.
 */
router.put("/:id", validateTrade({ partial: true }), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Trade id must be an integer." });
  }

  const updated = store.update(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: `No trade found with id ${id}.` });
  }

  res.status(200).json(updated);
});

/**
 * DELETE /api/trades/:id
 */
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Trade id must be an integer." });
  }

  const removed = store.remove(id);
  if (!removed) {
    return res.status(404).json({ error: `No trade found with id ${id}.` });
  }

  res.status(204).send();
});

module.exports = router;
