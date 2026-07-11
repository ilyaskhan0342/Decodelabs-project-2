"use strict";

const DIRECTIONS = ["long", "short"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates an incoming trade payload.
 * @param {boolean} partial - true for PATCH-style partial updates (PUT here treats
 *   missing fields as "keep existing", but still validates whatever IS present).
 */
function validateTrade({ partial = false } = {}) {
  return function (req, res, next) {
    const body = req.body || {};
    const errors = [];

    function required(field) {
      if (!partial && (body[field] === undefined || body[field] === null || body[field] === "")) {
        errors.push(`"${field}" is required.`);
        return false;
      }
      return true;
    }

    function isPresent(field) {
      return body[field] !== undefined && body[field] !== null && body[field] !== "";
    }

    // symbol
    if (required("symbol") && isPresent("symbol")) {
      if (typeof body.symbol !== "string" || body.symbol.trim().length === 0 || body.symbol.length > 15) {
        errors.push('"symbol" must be a non-empty string of 15 characters or fewer.');
      }
    }

    // direction
    if (required("direction") && isPresent("direction")) {
      if (!DIRECTIONS.includes(body.direction)) {
        errors.push(`"direction" must be one of: ${DIRECTIONS.join(", ")}.`);
      }
    }

    // entry / exit price
    ["entry", "exit"].forEach((field) => {
      if (required(field) && isPresent(field)) {
        const n = Number(body[field]);
        if (Number.isNaN(n) || n <= 0) {
          errors.push(`"${field}" must be a positive number.`);
        }
      }
    });

    // qty
    if (required("qty") && isPresent("qty")) {
      const n = Number(body.qty);
      if (Number.isNaN(n) || n <= 0) {
        errors.push('"qty" must be a positive number.');
      }
    }

    // date
    if (isPresent("date")) {
      if (typeof body.date !== "string" || !DATE_RE.test(body.date) || Number.isNaN(Date.parse(body.date))) {
        errors.push('"date" must be a valid date in YYYY-MM-DD format.');
      }
    } else if (!partial) {
      errors.push('"date" is required.');
    }

    // notes
    if (isPresent("notes")) {
      if (typeof body.notes !== "string" || body.notes.length > 500) {
        errors.push('"notes" must be a string of 500 characters or fewer.');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors
      });
    }

    // normalize numeric fields onto req.body for downstream handlers
    if (isPresent("entry")) body.entry = Number(body.entry);
    if (isPresent("exit")) body.exit = Number(body.exit);
    if (isPresent("qty")) body.qty = Number(body.qty);

    next();
  };
}

module.exports = validateTrade;
