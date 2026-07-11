"use strict";

/**
 * In-memory "database" for trade entries.
 * Resets every time the server restarts — swapping this module out
 * for a real database is the natural next step (Project 3).
 */

let trades = [];
let nextId = 1;

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function computePnl({ direction, entry, exit, qty }) {
  const raw = (exit - entry) * qty;
  return round2(direction === "long" ? raw : -raw);
}

function getAll(filters = {}) {
  let result = trades;

  if (filters.symbol) {
    const symbol = filters.symbol.toUpperCase();
    result = result.filter((t) => t.symbol === symbol);
  }
  if (filters.direction) {
    result = result.filter((t) => t.direction === filters.direction);
  }
  if (filters.result === "win") {
    result = result.filter((t) => t.pnl > 0);
  }
  if (filters.result === "loss") {
    result = result.filter((t) => t.pnl < 0);
  }

  return result;
}

function getById(id) {
  return trades.find((t) => t.id === id);
}

function create(data) {
  const trade = {
    id: nextId++,
    symbol: data.symbol.toUpperCase(),
    direction: data.direction,
    entry: data.entry,
    exit: data.exit,
    qty: data.qty,
    date: data.date,
    notes: data.notes || "",
    pnl: computePnl(data),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  trades.push(trade);
  return trade;
}

function update(id, data) {
  const trade = getById(id);
  if (!trade) return null;

  const merged = {
    symbol: data.symbol !== undefined ? data.symbol.toUpperCase() : trade.symbol,
    direction: data.direction !== undefined ? data.direction : trade.direction,
    entry: data.entry !== undefined ? data.entry : trade.entry,
    exit: data.exit !== undefined ? data.exit : trade.exit,
    qty: data.qty !== undefined ? data.qty : trade.qty,
    date: data.date !== undefined ? data.date : trade.date,
    notes: data.notes !== undefined ? data.notes : trade.notes
  };

  trade.symbol = merged.symbol;
  trade.direction = merged.direction;
  trade.entry = merged.entry;
  trade.exit = merged.exit;
  trade.qty = merged.qty;
  trade.date = merged.date;
  trade.notes = merged.notes;
  trade.pnl = computePnl(merged);
  trade.updatedAt = new Date().toISOString();

  return trade;
}

function remove(id) {
  const index = trades.findIndex((t) => t.id === id);
  if (index === -1) return false;
  trades.splice(index, 1);
  return true;
}

function clear() {
  trades = [];
  nextId = 1;
}

function stats() {
  const total = trades.length;
  const wins = trades.filter((t) => t.pnl > 0).length;
  const netPnl = round2(trades.reduce((sum, t) => sum + t.pnl, 0));
  const winRate = total ? round2((wins / total) * 100) : 0;
  const avgPnl = total ? round2(netPnl / total) : 0;

  return { total, wins, losses: total - wins, winRate, netPnl, avgPnl };
}

// Seed a couple of entries so the API isn't empty on first run.
create({ symbol: "EURUSD", direction: "long", entry: 1.0820, exit: 1.0885, qty: 10000, date: "2026-07-01", notes: "Broke out of the range on the London open." });
create({ symbol: "AAPL", direction: "short", entry: 196.40, exit: 198.10, qty: 25, date: "2026-07-05", notes: "Faded the gap up too early." });

module.exports = { getAll, getById, create, update, remove, clear, stats, computePnl };
