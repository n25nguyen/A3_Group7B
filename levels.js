// All beatmap and level data lives here.
// sketch.js calls generateBeatmap() to get the full note list.

function generateBeatmap() {
  const map = [];

  function F(beat, level)  { map.push({ beat, key: "F", level }); }
  function J(beat, level)  { map.push({ beat, key: "J", level }); }
  function D(beat, level)  { map.push({ beat, key: "D", level }); }
  function K(beat, level)  { map.push({ beat, key: "K", level }); }
  function S(beat, level)  { map.push({ beat, key: " ", level }); } // Space

  function FJ(beat, level) {
    map.push({ beat, key: "F", level });
    map.push({ beat, key: "J", level });
  }

  // ---- LEVEL 1 ----
  // Only F and J lanes — introductory level.
  // Structured in waves: sparse intro, then alternating calm/busy sections.

  // Wave 1: gentle intro (every 4 beats)
  F(0,  1);
  J(4,  1);
  F(8,  1);
  J(12, 1);

  // Wave 2: a little busier (every 2 beats)
  F(18, 1);
  J(20, 1);
  F(22, 1);
  J(24, 1);

  // Breather

  // Wave 3: back to sparse
  J(30, 1);
  F(34, 1);
  J(38, 1);

  // Wave 4: burst with a double
  F(44, 1);
  J(46, 1);
  FJ(48, 1);
  F(50, 1);

  // Breather

  // Wave 5: sparse again
  J(56, 1);
  F(60, 1);
  J(64, 1);

  // Wave 6: closing burst
  F(70, 1);
  J(72, 1);
  F(74, 1);
  FJ(76, 1);
  J(78, 1);
  F(80, 1);

  // ---- LEVEL 2 ----
  // Introduces D and K lanes alongside F and J.
  // Longer waves with clearer gaps so the pacing can breathe.

  // Wave 1: simple lane tour
  F(0,  2);
  J(2,  2);
  D(4,  2);
  K(6,  2);
  FJ(8, 2);
  D(10, 2);

  // Breather

  // Wave 2: start mixing singles and doubles
  K(16, 2);
  F(18, 2);
  J(19, 2);
  D(21, 2);
  K(23, 2);
  FJ(24, 2);
  D(26, 2);
  J(28, 2);

  // Breather

  // Wave 3: busier center section
  F(34, 2);
  K(36, 2);
  D(38, 2);
  FJ(39, 2);
  J(41, 2);
  K(43, 2);
  F(44, 2);
  D(46, 2);

  // Breather

  // Wave 4: alternating lanes with a couple doubles
  FJ(52, 2);
  K(53, 2);
  D(55, 2);
  F(57, 2);
  J(58, 2);
  K(60, 2);
  FJ(62, 2);
  D(64, 2);
  J(65, 2);
  K(67, 2);

  // Breather

  // Wave 5: longer closing run so the progress bar has room to move
  F(74, 2);
  D(76, 2);
  K(77, 2);
  FJ(79, 2);
  J(81, 2);
  D(82, 2);
  K(84, 2);
  F(86, 2);
  FJ(87, 2);
  D(89, 2);
  J(91, 2);
  K(93, 2);

  // ---- LEVEL 3 ----
  // All 5 lanes active including Space. Longer waves keep the bar moving here too.

  // Wave 1: full-lane introduction
  F(0,  3);
  D(2,  3);
  J(3,  3);
  K(5,  3);
  FJ(6, 3);
  S(8,  3);
  D(9,  3);
  K(11, 3);

  // Breather

  // Wave 2: tighter alternation with space taps
  F(18,  3);
  S(19,  3);
  D(21,  3);
  FJ(22, 3);
  K(24,  3);
  J(25,  3);
  S(27,  3);
  D(28,  3);
  K(30,  3);
  FJ(31, 3);

  // Breather

  // Wave 3: sustained mid-level pressure
  F(38,  3);
  D(40,  3);
  S(41,  3);
  FJ(43, 3);
  K(44,  3);
  J(46,  3);
  S(47,  3);
  D(49,  3);
  FJ(50, 3);
  K(52,  3);

  // Breather

  // Wave 4: faster cross-lane swaps
  J(60,  3);
  S(61,  3);
  D(63,  3);
  K(64,  3);
  FJ(66, 3);
  S(67,  3);
  F(69,  3);
  D(70,  3);
  FJ(72, 3);
  K(73,  3);

  // Breather

  // Wave 5: extended finale that pushes past the hit-bar movement threshold
  S(82,  3);
  F(84,  3);
  FJ(87, 3);
  K(88,  3);
  S(90,  3);
  J(91,  3);
  D(93,  3);
  FJ(94, 3);
  K(96,  3);

  return map;
}
