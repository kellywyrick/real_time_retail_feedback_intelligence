// Node-oriented editable pro deck builder.
// Run this after editing SLIDES, SOURCES, and layout functions.
// The init script installs a sibling node_modules/@oai/artifact-tool package link
// and package.json with type=module for shell-run eval builders. Run with the
// Node executable from Codex workspace dependencies or the platform-appropriate
// command emitted by the init script.
// Do not use pnpm exec from the repo root or any Node binary whose module
// lookup cannot resolve the builder's sibling node_modules/@oai/artifact-tool.

const fs = await import("node:fs/promises");
const path = await import("node:path");
const { Presentation, PresentationFile } = await import("@oai/artifact-tool");

const W = 1280;
const H = 720;

const DECK_ID = "chicstyle-retail-feedback-capstone";
const OUT_DIR = "/Users/kellywyrick/Documents/New project/outputs/chicstyle-capstone-deck";
const REF_DIR = "/Users/kellywyrick/Documents/New project/tmp/slides/chicstyle-capstone-deck/pro-reference-images";
const SCRATCH_DIR = path.resolve(process.env.PPTX_SCRATCH_DIR || path.join("tmp", "slides", DECK_ID));
const PREVIEW_DIR = path.join(SCRATCH_DIR, "preview");
const VERIFICATION_DIR = path.join(SCRATCH_DIR, "verification");
const INSPECT_PATH = path.join(SCRATCH_DIR, "inspect.ndjson");
const MAX_RENDER_VERIFY_LOOPS = 3;

const INK = "#101214";
const GRAPHITE = "#30363A";
const MUTED = "#687076";
const PAPER = "#F7F4ED";
const PAPER_96 = "#F7F4EDF5";
const WHITE = "#FFFFFF";
const ACCENT = "#27C47D";
const ACCENT_DARK = "#116B49";
const GOLD = "#D7A83D";
const CORAL = "#E86F5B";
const SKY = "#5EA7D8";
const TRANSPARENT = "#00000000";

const TITLE_FACE = "Poppins";
const BODY_FACE = "Lato";
const MONO_FACE = "Aptos Mono";

const SOURCES = {
  notebook: "Project notebook: Real-Time_Retail_Feedback_Intelligence_Full_code_KWM (1).ipynb",
  dataset: "Dataset - Real-Time Retail Feedback Intelligence.csv",
  evaluation: "Prompt comparison based on four repeated LLM-as-Judge runs and 50-review final evaluation sample.",
};

const DATA = {
  usableReviews: 22641,
  finalSample: 50,
  departments: 6,
  classes: 20,
  avgRating: 4.18,
  positiveShare: 77.07,
  ratingCategories: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
  ratingCounts: [821, 1549, 2823, 4908, 12540],
  topDepartment: { name: "Bottoms", rating: 4.279 },
  bottomDepartment: { name: "Trend", rating: 3.839 },
  promptScores: [
    ["ZS V1", 91.6],
    ["ZS V2", 85.8],
    ["FS V1", 90.95],
    ["FS V2", 88.5],
    ["CoT V1", 89.45],
    ["CoT V2", 91.05],
  ],
  recommendationMetrics: [
    ["80%", "overall recommendation prediction accuracy"],
    ["100%", "of not-recommended reviews captured"],
    ["74%", "of recommended reviews captured"],
  ],
};

const SLIDES = [
  {
    kicker: "Capstone Presentation",
    title: "Real-Time Retail Feedback Intelligence for ChicStyle",
    subtitle: "Using Generative AI to turn customer reviews into structured retail action.",
    notes:
      "Open with the executive summary. Emphasize that the project solves a speed-and-clarity problem: too many reviews, too little time, and too much nuance for basic sentiment analysis alone.",
    sources: ["notebook", "dataset", "evaluation"],
  },
  {
    kicker: "Business Need",
    title: "Why this problem matters",
    subtitle: "Holiday review spikes make manual review slow, inconsistent, and hard to scale.",
    notes:
      "Explain the operational risk first: missed complaints, delayed response, weaker trust, and lost repeat purchases. Then frame the objective as faster prioritization and clearer action for support, merchandising, and product teams.",
    sources: ["notebook"],
  },
  {
    kicker: "Solution Design",
    title: "Data and workflow design",
    subtitle: "The pipeline combines retail context, prompt engineering, evaluation, and recommendation prediction.",
    notes:
      "Clarify that the full dataset supports EDA, while the final GenAI comparison uses a 50-review sample to stay within API budget. Walk left to right through the pipeline.",
    sources: ["dataset", "notebook", "evaluation"],
  },
  {
    kicker: "EDA",
    title: "The catalog is well liked overall, but pain points are concentrated",
    subtitle: "Ratings skew strongly positive, yet recurring issues are clear enough to guide action.",
    notes:
      "Use the rating chart to show that most reviews are favorable. Then pivot to why the remaining dissatisfaction matters: it clusters around sizing, fit, quality, and product accuracy.",
    sources: ["dataset", "notebook"],
  },
  {
    kicker: "Prompt Results",
    title: "Simple, direct prompting worked best",
    subtitle: "Repeated evaluation showed a stable ranking across Zero-Shot, Few-Shot, and CoT variants.",
    notes:
      "Anchor on the four-run average, not any single run. Explain that Zero-Shot V1 was the best-performing prompt, while CoT V2 was a strong alternative for more nuanced reviews.",
    sources: ["notebook", "evaluation"],
  },
  {
    kicker: "Recommendation Signal",
    title: "The recommendation prompt works well as a triage signal",
    subtitle: "It is strongest at catching negative recommendation intent without overstating positive intent.",
    notes:
      "Translate the metrics into business language. Avoid saying confusion matrix. Emphasize that the model is conservative and useful for routing attention to higher-risk reviews.",
    sources: ["notebook"],
  },
  {
    kicker: "Customer Themes",
    title: "Customer feedback points to a few repeating root causes",
    subtitle: "The same issues appear across summaries, sentiment labels, and review-level retail insights.",
    notes:
      "This is the bridge from model output to business meaning. Show both the dissatisfaction drivers and the product strengths worth preserving in merchandising.",
    sources: ["notebook"],
  },
  {
    kicker: "Action Plan",
    title: "Recommended business actions",
    subtitle: "Short-term fixes improve the customer experience now; long-term actions reduce repeat friction.",
    notes:
      "Make the recommendations sound operational, not academic. Tie each action back to something surfaced in the reviews.",
    sources: ["notebook"],
  },
  {
    kicker: "Decision",
    title: "Recommended path forward",
    subtitle: "Start with the simplest high-performing prompt, then expand with stronger validation and scale.",
    notes:
      "Close with a decision-ready message: adopt Zero-Shot V1 as the baseline, keep CoT V2 as an escalation path, and pilot the workflow on a larger fixed sample with human validation.",
    sources: ["notebook", "evaluation"],
  },
];

const inspectRecords = [];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  if (!bytes.byteLength) {
    throw new Error(`Image file is empty: ${imagePath}`);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

async function normalizeImageConfig(config) {
  if (!config.path) {
    return config;
  }
  const { path: imagePath, ...rest } = config;
  return {
    ...rest,
    blob: await readImageBlob(imagePath),
  };
}

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const obsoleteFinalArtifacts = [
    "preview",
    "verification",
    "inspect.ndjson",
    ["presentation", "proto.json"].join("_"),
    ["quality", "report.json"].join("_"),
  ];
  for (const obsolete of obsoleteFinalArtifacts) {
    await fs.rm(path.join(OUT_DIR, obsolete), { recursive: true, force: true });
  }
  await fs.mkdir(SCRATCH_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(VERIFICATION_DIR, { recursive: true });
}

function lineConfig(fill = TRANSPARENT, width = 0) {
  return { style: "solid", fill, width };
}

function recordShape(slideNo, shape, role, shapeType, x, y, w, h) {
  if (!slideNo) return;
  inspectRecords.push({
    kind: "shape",
    slide: slideNo,
    id: shape?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    shapeType,
    bbox: [x, y, w, h],
  });
}

function addShape(slide, geometry, x, y, w, h, fill = TRANSPARENT, line = TRANSPARENT, lineWidth = 0, meta = {}) {
  const shape = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: lineConfig(line, lineWidth),
  });
  recordShape(meta.slideNo, shape, meta.role || geometry, geometry, x, y, w, h);
  return shape;
}

function normalizeText(text) {
  if (Array.isArray(text)) {
    return text.map((item) => String(item ?? "")).join("\n");
  }
  return String(text ?? "");
}

function textLineCount(text) {
  const value = normalizeText(text);
  if (!value.trim()) {
    return 0;
  }
  return Math.max(1, value.split(/\n/).length);
}

function requiredTextHeight(text, fontSize, lineHeight = 1.18, minHeight = 8) {
  const lines = textLineCount(text);
  if (lines === 0) {
    return minHeight;
  }
  return Math.max(minHeight, lines * fontSize * lineHeight);
}

function assertTextFits(text, boxHeight, fontSize, role = "text") {
  const required = requiredTextHeight(text, fontSize);
  const tolerance = Math.max(2, fontSize * 0.08);
  if (normalizeText(text).trim() && boxHeight + tolerance < required) {
    throw new Error(
      `${role} text box is too short: height=${boxHeight.toFixed(1)}, required>=${required.toFixed(1)}, ` +
        `lines=${textLineCount(text)}, fontSize=${fontSize}, text=${JSON.stringify(normalizeText(text).slice(0, 90))}`,
    );
  }
}

function wrapText(text, widthChars) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > widthChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.join("\n");
}

function recordText(slideNo, shape, role, text, x, y, w, h) {
  const value = normalizeText(text);
  inspectRecords.push({
    kind: "textbox",
    slide: slideNo,
    id: shape?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    text: value,
    textPreview: value.replace(/\n/g, " | ").slice(0, 180),
    textChars: value.length,
    textLines: textLineCount(value),
    bbox: [x, y, w, h],
  });
}

function recordImage(slideNo, image, role, imagePath, x, y, w, h) {
  inspectRecords.push({
    kind: "image",
    slide: slideNo,
    id: image?.id || `slide-${slideNo}-${role}-${inspectRecords.length + 1}`,
    role,
    path: imagePath,
    bbox: [x, y, w, h],
  });
}

function applyTextStyle(box, text, size, color, bold, face, align, valign, autoFit, listStyle) {
  box.text = text;
  box.text.fontSize = size;
  box.text.color = color;
  box.text.bold = Boolean(bold);
  box.text.alignment = align;
  box.text.verticalAlignment = valign;
  box.text.typeface = face;
  box.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  if (autoFit) {
    box.text.autoFit = autoFit;
  }
  if (listStyle) {
    box.text.style = "list";
  }
}

function addText(
  slide,
  slideNo,
  text,
  x,
  y,
  w,
  h,
  {
    size = 22,
    color = INK,
    bold = false,
    face = BODY_FACE,
    align = "left",
    valign = "top",
    fill = TRANSPARENT,
    line = TRANSPARENT,
    lineWidth = 0,
    autoFit = null,
    listStyle = false,
    checkFit = true,
    role = "text",
  } = {},
) {
  if (!checkFit && textLineCount(text) > 1) {
    throw new Error("checkFit=false is only allowed for single-line headers, footers, and captions.");
  }
  if (checkFit) {
    assertTextFits(text, h, size, role);
  }
  const box = addShape(slide, "rect", x, y, w, h, fill, line, lineWidth);
  applyTextStyle(box, text, size, color, bold, face, align, valign, autoFit, listStyle);
  recordText(slideNo, box, role, text, x, y, w, h);
  return box;
}

async function addImage(slide, slideNo, config, position, role, sourcePath = null) {
  const image = slide.images.add(await normalizeImageConfig(config));
  image.position = position;
  recordImage(slideNo, image, role, sourcePath || config.path || config.uri || "inline-data-url", position.left, position.top, position.width, position.height);
  return image;
}

async function addPlate(slide, slideNo, opacityPanel = false) {
  slide.background.fill = PAPER;
  addShape(slide, "ellipse", 960, -120, 380, 380, "#D9F4E8", TRANSPARENT, 0, { slideNo, role: "backdrop orb" });
  addShape(slide, "ellipse", 1080, 28, 180, 180, "#F7E8BC", TRANSPARENT, 0, { slideNo, role: "backdrop orb" });
  addShape(slide, "ellipse", -120, 570, 220, 220, "#F7D7D1", TRANSPARENT, 0, { slideNo, role: "backdrop orb" });
  addShape(slide, "rect", 0, 0, W, 10, ACCENT, TRANSPARENT, 0, { slideNo, role: "accent top rule" });
  if (opacityPanel) {
    addShape(slide, "rect", 0, 0, W, H, "#FFFFFFB8", TRANSPARENT, 0, { slideNo, role: "plate readability overlay" });
  }
}

function addHeader(slide, slideNo, kicker, idx, total) {
  addText(slide, slideNo, String(kicker || "").toUpperCase(), 64, 34, 430, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    checkFit: false,
    role: "header",
  });
  addText(slide, slideNo, `${String(idx).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, 1114, 34, 104, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    align: "right",
    checkFit: false,
    role: "header",
  });
  addShape(slide, "rect", 64, 64, 1152, 2, INK, TRANSPARENT, 0, { slideNo, role: "header rule" });
  addShape(slide, "ellipse", 57, 57, 16, 16, ACCENT, INK, 2, { slideNo, role: "header marker" });
}

function addTitleBlock(slide, slideNo, title, subtitle = null, x = 64, y = 86, w = 780, dark = false) {
  const titleColor = dark ? PAPER : INK;
  const bodyColor = dark ? PAPER : GRAPHITE;
  addText(slide, slideNo, title, x, y, w, 142, {
    size: 40,
    color: titleColor,
    bold: true,
    face: TITLE_FACE,
    role: "title",
  });
  if (subtitle) {
    addText(slide, slideNo, subtitle, x + 2, y + 108, Math.min(w, 720), 34, {
      size: 16,
      color: bodyColor,
      face: BODY_FACE,
      role: "subtitle",
    });
  }
}

function addIconBadge(slide, slideNo, x, y, accent = ACCENT, kind = "signal") {
  addShape(slide, "ellipse", x, y, 54, 54, PAPER_96, INK, 1.2, { slideNo, role: "icon badge" });
  if (kind === "flow") {
    addShape(slide, "ellipse", x + 13, y + 18, 10, 10, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "ellipse", x + 31, y + 27, 10, 10, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 22, y + 25, 19, 3, INK, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
  } else if (kind === "layers") {
    addShape(slide, "roundRect", x + 13, y + 15, 26, 13, accent, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "roundRect", x + 18, y + 24, 26, 13, GOLD, INK, 1, { slideNo, role: "icon glyph" });
    addShape(slide, "roundRect", x + 23, y + 33, 20, 10, CORAL, INK, 1, { slideNo, role: "icon glyph" });
  } else {
    addShape(slide, "rect", x + 16, y + 29, 6, 12, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 25, y + 21, 6, 20, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
    addShape(slide, "rect", x + 34, y + 14, 6, 27, accent, TRANSPARENT, 0, { slideNo, role: "icon glyph" });
  }
}

function addCard(slide, slideNo, x, y, w, h, label, body, { accent = ACCENT, fill = PAPER_96, line = INK, iconKind = "signal" } = {}) {
  if (h < 156) {
    throw new Error(`Card is too short for editable pro-deck copy: height=${h.toFixed(1)}, minimum=156.`);
  }
  addShape(slide, "roundRect", x, y, w, h, fill, line, 1.2, { slideNo, role: `card panel: ${label}` });
  addShape(slide, "rect", x, y, 8, h, accent, TRANSPARENT, 0, { slideNo, role: `card accent: ${label}` });
  addIconBadge(slide, slideNo, x + 22, y + 24, accent, iconKind);
  addText(slide, slideNo, label, x + 88, y + 22, w - 108, 28, {
    size: 15,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "card label",
  });
  const wrapped = wrapText(body, Math.max(28, Math.floor(w / 13)));
  const bodyY = y + 86;
  const bodyH = h - (bodyY - y) - 22;
  if (bodyH < 54) {
    throw new Error(`Card body area is too short: height=${bodyH.toFixed(1)}, cardHeight=${h.toFixed(1)}, label=${JSON.stringify(label)}.`);
  }
  addText(slide, slideNo, wrapped, x + 24, bodyY, w - 48, bodyH, {
    size: 17,
    color: INK,
    face: BODY_FACE,
    role: `card body: ${label}`,
  });
}

function addMetricCard(slide, slideNo, x, y, w, h, metric, label, note = null, accent = ACCENT) {
  if (h < 132) {
    throw new Error(`Metric card is too short for editable pro-deck copy: height=${h.toFixed(1)}, minimum=132.`);
  }
  const metricFontSize = metric.includes("\n") || metric.length > 14 ? 26 : 34;
  const metricHeight = metric.includes("\n") ? 64 : 54;
  addShape(slide, "roundRect", x, y, w, h, PAPER_96, INK, 1.2, { slideNo, role: `metric panel: ${label}` });
  addShape(slide, "rect", x, y, w, 7, accent, TRANSPARENT, 0, { slideNo, role: `metric accent: ${label}` });
  addText(slide, slideNo, metric, x + 22, y + 20, w - 44, metricHeight, {
    size: metricFontSize,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "metric value",
  });
  addText(slide, slideNo, label, x + 24, y + 90, w - 48, 42, {
    size: 16,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "metric label",
  });
  if (note) {
    addText(slide, slideNo, note, x + 24, y + h - 42, w - 48, 22, {
      size: 10,
      color: MUTED,
      face: BODY_FACE,
      role: "metric note",
    });
  }
}

function addNotes(slide, body, sourceKeys) {
  const sourceLines = (sourceKeys || []).map((key) => `- ${SOURCES[key] || key}`).join("\n");
  slide.speakerNotes.setText(`${body || ""}\n\n[Sources]\n${sourceLines}`);
}

function addReferenceCaption(slide, slideNo) {
  return { slide, slideNo };
}

function addPanel(slide, slideNo, x, y, w, h, { fill = PAPER_96, line = INK, accent = ACCENT, role = "panel" } = {}) {
  addShape(slide, "roundRect", x, y, w, h, fill, line, 1.2, { slideNo, role: `${role} frame` });
  addShape(slide, "rect", x, y, w, 7, accent, TRANSPARENT, 0, { slideNo, role: `${role} accent` });
}

function addSummaryCard(slide, slideNo, x, y, w, h, label, body, accent = ACCENT) {
  addPanel(slide, slideNo, x, y, w, h, { accent, role: `summary card ${label}` });
  addText(slide, slideNo, label.toUpperCase(), x + 20, y + 18, w - 40, 22, {
    size: 12,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "summary card label",
  });
  addText(slide, slideNo, wrapText(body, Math.max(24, Math.floor(w / 11))), x + 20, y + 46, w - 40, h - 54, {
    size: 16,
    color: INK,
    face: BODY_FACE,
    role: "summary card body",
  });
}

function addBulletPanel(slide, slideNo, x, y, w, h, label, items, { accent = ACCENT, fill = PAPER_96, role = "bullet panel" } = {}) {
  addPanel(slide, slideNo, x, y, w, h, { accent, fill, role });
  addText(slide, slideNo, label, x + 22, y + 20, w - 44, 30, {
    size: 20,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "panel title",
  });
  const bulletLines = items.map((item) => `• ${wrapText(item, Math.max(26, Math.floor((w - 56) / 10)))}`).join("\n");
  addText(slide, slideNo, bulletLines, x + 24, y + 66, w - 48, h - 88, {
    size: 17,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "bullet list",
  });
}

function addNarrativePanel(slide, slideNo, x, y, w, h, label, body, { accent = ACCENT, fill = PAPER_96, role = "narrative panel", size = 18 } = {}) {
  addPanel(slide, slideNo, x, y, w, h, { accent, fill, role });
  addText(slide, slideNo, label, x + 22, y + 18, w - 44, 28, {
    size: 18,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "narrative title",
  });
  addText(slide, slideNo, wrapText(body, Math.max(26, Math.floor((w - 52) / 10))), x + 24, y + 52, w - 48, h - 66, {
    size,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "narrative body",
  });
}

function addFlowStep(slide, slideNo, x, y, w, h, step, body, accent = ACCENT) {
  addPanel(slide, slideNo, x, y, w, h, { accent, role: `flow step ${step}` });
  addText(slide, slideNo, step, x + 18, y + 18, w - 36, 24, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "flow label",
  });
  addText(slide, slideNo, wrapText(body, Math.max(20, Math.floor((w - 38) / 10))), x + 18, y + 50, w - 36, h - 64, {
    size: 14,
    color: INK,
    face: BODY_FACE,
    role: "flow body",
  });
}

function recordChart(slideNo, role, x, y, w, h, categories, values) {
  inspectRecords.push({
    kind: "chart",
    slide: slideNo,
    role,
    bbox: [x, y, w, h],
    categories,
    values,
  });
}

function addBarChartPanel(
  slide,
  slideNo,
  x,
  y,
  w,
  h,
  panelTitle,
  categories,
  values,
  {
    seriesName = "Series 1",
    accent = ACCENT,
    numberFormat = "0",
  } = {},
) {
  addPanel(slide, slideNo, x, y, w, h, { accent, role: `chart panel ${panelTitle}` });
  addText(slide, slideNo, panelTitle, x + 22, y + 20, w - 44, 28, {
    size: 18,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "chart panel title",
  });
  const chart = slide.charts.add("bar");
  chart.position = { left: x + 24, top: y + 64, width: w - 48, height: h - 88 };
  chart.categories = categories;
  const series = chart.series.add(seriesName);
  series.values = values;
  series.categories = categories;
  series.fill = accent;
  series.stroke = { width: 1, style: "solid", fill: accent };
  chart.hasLegend = false;
  chart.barOptions.direction = "column";
  chart.dataLabels.showValue = true;
  chart.dataLabels.position = "outEnd";
  chart.dataLabels.numberFormat = numberFormat;
  chart.dataLabels.textStyle.typeface = BODY_FACE;
  chart.dataLabels.textStyle.fontSize = 11;
  chart.dataLabels.textStyle.fill = GRAPHITE;
  chart.plotAreaFill = "#FFFFFF00";
  chart.xAxis.textStyle.typeface = BODY_FACE;
  chart.xAxis.textStyle.fontSize = 11;
  chart.xAxis.textStyle.fill = GRAPHITE;
  chart.yAxis.textStyle.typeface = BODY_FACE;
  chart.yAxis.textStyle.fontSize = 11;
  chart.yAxis.textStyle.fill = GRAPHITE;
  recordChart(slideNo, panelTitle, x + 24, y + 64, w - 48, h - 88, categories, values);
}

async function slideCover(presentation) {
  const slideNo = 1;
  const data = SLIDES[0];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addShape(slide, "rect", 736, 48, 484, 624, "#FFFFFFD9", TRANSPARENT, 0, { slideNo, role: "cover side panel" });
  addShape(slide, "rect", 64, 86, 7, 472, ACCENT, TRANSPARENT, 0, { slideNo, role: "cover accent rule" });
  addText(slide, slideNo, data.kicker, 86, 88, 520, 26, {
    size: 13,
    color: ACCENT_DARK,
    bold: true,
    face: MONO_FACE,
    role: "kicker",
  });
  addText(slide, slideNo, data.title, 82, 130, 785, 184, {
    size: 46,
    color: INK,
    bold: true,
    face: TITLE_FACE,
    role: "cover title",
  });
  addText(slide, slideNo, data.subtitle, 86, 322, 610, 86, {
    size: 20,
    color: GRAPHITE,
    face: BODY_FACE,
    role: "cover subtitle",
  });
  addNarrativePanel(
    slide,
    slideNo,
    86,
    452,
    580,
    136,
    "Executive framing",
    "The goal is simple: turn review text into faster, clearer decisions for support, merchandising, and product teams.",
    { accent: GOLD, size: 17, role: "cover framing" },
  );
  addSummaryCard(
    slide,
    slideNo,
    760,
    104,
    426,
    116,
    "Business need",
    "Peak-season reviews carry urgent signals on fit, quality, delivery, and customer trust.",
    ACCENT,
  );
  addSummaryCard(
    slide,
    slideNo,
    760,
    246,
    426,
    116,
    "Best GenAI prompt",
    "Zero-Shot V1 produced the strongest structured outputs, with CoT V2 close behind.",
    GOLD,
  );
  addSummaryCard(
    slide,
    slideNo,
    760,
    388,
    426,
    116,
    "Action focus",
    "Top actions: sizing consistency, fit guidance, better photography, and clearer fabric details.",
    CORAL,
  );
  addText(slide, slideNo, "22,641 usable reviews | 50-review final GenAI evaluation sample", 86, 604, 540, 24, {
    size: 12,
    color: MUTED,
    face: BODY_FACE,
    checkFit: false,
    role: "cover footer note",
  });
  addNotes(slide, data.notes, data.sources);
}

async function slideBusinessProblem(presentation) {
  const slideNo = 2;
  const data = SLIDES[1];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addHeader(slide, slideNo, data.kicker, slideNo, SLIDES.length);
  addTitleBlock(slide, slideNo, data.title, data.subtitle, 64, 86, 780);
  addBulletPanel(slide, slideNo, 64, 238, 548, 262, "Why the current process breaks down", [
    "Holiday spikes create more reviews than support and merchandising teams can read manually.",
    "Simple positive-versus-negative tagging misses mixed issues such as style praise paired with fit complaints.",
    "Slow review triage delays action on return drivers, product-page fixes, and urgent customer dissatisfaction.",
  ], { accent: ACCENT, role: "problem panel" });
  addBulletPanel(slide, slideNo, 668, 238, 548, 262, "What the solution must deliver", [
    "Classify the issue being discussed, not just the sentiment tone.",
    "Summarize each review and draft an empathetic customer-facing response.",
    "Extract a retail action the business can monitor or fix.",
    "Predict whether the customer would recommend the product.",
  ], { accent: GOLD, role: "objective panel" });
  addNarrativePanel(
    slide,
    slideNo,
    64,
    532,
    1152,
    118,
    "Business outcome",
    "The target state is faster review triage, clearer ownership across support and merchandising, and better product decisions grounded in live customer feedback.",
    { accent: CORAL, size: 18, role: "outcome panel" },
  );
  addNotes(slide, data.notes, data.sources);
}

async function slideWorkflow(presentation) {
  const slideNo = 3;
  const data = SLIDES[2];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addHeader(slide, slideNo, data.kicker, slideNo, SLIDES.length);
  addTitleBlock(slide, slideNo, data.title, data.subtitle, 64, 86, 820);
  addMetricCard(slide, slideNo, 76, 222, 352, 150, `${DATA.usableReviews.toLocaleString()}`, "usable reviews in the cleaned dataset", null, ACCENT);
  addMetricCard(slide, slideNo, 464, 222, 352, 150, `${DATA.finalSample}`, "reviews in the final GenAI comparison sample", null, GOLD);
  addMetricCard(slide, slideNo, 852, 222, 352, 150, `${DATA.departments} depts\n${DATA.classes} classes`, "product context available to group insights", null, CORAL);

  const steps = [
    ["1. Prepare", "Clean review text and keep the original recommendation label outside the prompt."],
    ["2. Explore", "Use EDA to understand ratings, departments, common terms, and likely dissatisfaction drivers."],
    ["3. Generate", "Run Zero-Shot, Few-Shot, and CoT prompts to produce structured review outputs."],
    ["4. Evaluate", "Score prompt quality with an LLM-as-Judge across repeated runs to reduce randomness."],
    ["5. Act", "Turn the best outputs into recommendations, routing signals, and merchandising actions."],
  ];
  const stepW = 208;
  const gap = 18;
  const baseX = 64;
  for (let idx = 0; idx < steps.length; idx += 1) {
    const [label, body] = steps[idx];
    const x = baseX + idx * (stepW + gap);
    addFlowStep(slide, slideNo, x, 424, stepW, 176, label, body, [ACCENT, GOLD, CORAL, SKY, ACCENT_DARK][idx]);
    if (idx < steps.length - 1) {
      addShape(slide, "rightArrow", x + stepW + 4, 496, 18, 24, GRAPHITE, TRANSPARENT, 0, { slideNo, role: "flow arrow" });
    }
  }
  addNotes(slide, data.notes, data.sources);
}

async function slideEda(presentation) {
  const slideNo = 4;
  const data = SLIDES[3];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addHeader(slide, slideNo, data.kicker, slideNo, SLIDES.length);
  addTitleBlock(slide, slideNo, data.title, data.subtitle, 64, 86, 820);
  addBarChartPanel(slide, slideNo, 64, 224, 660, 392, "Rating distribution across usable reviews", DATA.ratingCategories, DATA.ratingCounts, {
    seriesName: "Review count",
    accent: ACCENT,
    numberFormat: "0",
  });
  addNarrativePanel(
    slide,
    slideNo,
    752,
    224,
    464,
    176,
    "What the ratings say",
    `${DATA.avgRating.toFixed(2)} average rating and ${DATA.positiveShare.toFixed(1)}% of reviews at 4 or 5 stars show that the catalog is broadly well received.`,
    { accent: GOLD, size: 19, role: "ratings takeaway" },
  );
  addNarrativePanel(
    slide,
    slideNo,
    752,
    430,
    464,
    186,
    "Where friction shows up",
    `${DATA.topDepartment.name} has the highest average rating at ${DATA.topDepartment.rating.toFixed(3)}, while ${DATA.bottomDepartment.name} is lowest at ${DATA.bottomDepartment.rating.toFixed(3)}. Negative reviews repeatedly mention sizing inconsistency, fabric quality, and photo-to-product mismatch.`,
    { accent: CORAL, size: 18, role: "friction takeaway" },
  );
  addNotes(slide, data.notes, data.sources);
}

async function slidePromptResults(presentation) {
  const slideNo = 5;
  const data = SLIDES[4];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addHeader(slide, slideNo, data.kicker, slideNo, SLIDES.length);
  addTitleBlock(slide, slideNo, data.title, data.subtitle, 64, 86, 820);
  addBarChartPanel(
    slide,
    slideNo,
    64,
    224,
    700,
    392,
    "Average judge score across four runs (out of 100)",
    DATA.promptScores.map((item) => item[0]),
    DATA.promptScores.map((item) => item[1]),
    { seriesName: "Average judge score", accent: ACCENT, numberFormat: "0.0" },
  );
  addNarrativePanel(
    slide,
    slideNo,
    792,
    224,
    424,
    128,
    "Best overall",
    "Zero-Shot V1 ranked first at 91.6, with CoT V2 close behind at 91.05 and Few-Shot V1 at 90.95.",
    { accent: ACCENT, size: 17, role: "best prompt panel" },
  );
  addNarrativePanel(
    slide,
    slideNo,
    792,
    357,
    424,
    128,
    "What changed in V2",
    "V2 added useful structure for CoT, but extra context weakened the Zero-Shot and Few-Shot versions.",
    { accent: GOLD, size: 17, role: "v2 impact panel" },
  );
  addNarrativePanel(
    slide,
    slideNo,
    792,
    490,
    424,
    124,
    "Operational conclusion",
    "All prompts parsed cleanly, so the main difference was output usefulness rather than formatting stability.",
    { accent: CORAL, size: 16, role: "operational conclusion panel" },
  );
  addNotes(slide, data.notes, data.sources);
}

async function slideRecommendationSignal(presentation) {
  const slideNo = 6;
  const data = SLIDES[5];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addHeader(slide, slideNo, data.kicker, slideNo, SLIDES.length);
  addTitleBlock(slide, slideNo, data.title, data.subtitle, 64, 86, 820);
  addMetricCard(slide, slideNo, 76, 224, 352, 154, DATA.recommendationMetrics[0][0], DATA.recommendationMetrics[0][1], null, ACCENT);
  addMetricCard(slide, slideNo, 464, 224, 352, 154, DATA.recommendationMetrics[1][0], DATA.recommendationMetrics[1][1], null, GOLD);
  addMetricCard(slide, slideNo, 852, 224, 352, 154, DATA.recommendationMetrics[2][0], DATA.recommendationMetrics[2][1], null, CORAL);
  addNarrativePanel(
    slide,
    slideNo,
    64,
    430,
    560,
    178,
    "What it means operationally",
    "The prompt is strong for triage because it caught every not-recommended review in the sample. It is more conservative on positive recommendations, so it is better for routing risk than replacing human review.",
    { accent: ACCENT, size: 18, role: "recommendation meaning" },
  );
  addNarrativePanel(
    slide,
    slideNo,
    656,
    430,
    560,
    178,
    "What sentiment nuance tells us",
    "The V2 prompts labeled more reviews as neutral than the V1 prompts. That suggests better recognition of mixed feedback, even though the highest judged quality still came from the simpler Zero-Shot V1 prompt.",
    { accent: SKY, size: 18, role: "sentiment nuance" },
  );
  addNotes(slide, data.notes, data.sources);
}

async function slideThemes(presentation) {
  const slideNo = 7;
  const data = SLIDES[6];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addHeader(slide, slideNo, data.kicker, slideNo, SLIDES.length);
  addTitleBlock(slide, slideNo, data.title, data.subtitle, 64, 86, 820);
  addNarrativePanel(
    slide,
    slideNo,
    64,
    224,
    552,
    180,
    "Sizing consistency",
    "Customers struggle when similar styles fit differently. Better size charts and clearer fit guidance should be treated as a revenue-protection lever.",
    { accent: ACCENT, size: 18, role: "theme sizing" },
  );
  addNarrativePanel(
    slide,
    slideNo,
    664,
    224,
    552,
    180,
    "Fit and comfort",
    "Sleeves, bust, waist, and overall drape appear often in review friction. Fit comments are specific enough to guide merchandising and product development.",
    { accent: GOLD, size: 18, role: "theme fit" },
  );
  addNarrativePanel(
    slide,
    slideNo,
    64,
    430,
    552,
    180,
    "Image and color accuracy",
    "Product photos and descriptions shape expectations. When color, texture, or silhouette do not match the product page, dissatisfaction rises quickly.",
    { accent: CORAL, size: 18, role: "theme image" },
  );
  addNarrativePanel(
    slide,
    slideNo,
    664,
    430,
    552,
    180,
    "Material quality and style strength",
    "Customers consistently reward flattering, versatile designs, but they also notice softness, durability, and fabric quality almost immediately.",
    { accent: SKY, size: 18, role: "theme quality" },
  );
  addNotes(slide, data.notes, data.sources);
}

async function slideRecommendations(presentation) {
  const slideNo = 8;
  const data = SLIDES[7];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addHeader(slide, slideNo, data.kicker, slideNo, SLIDES.length);
  addTitleBlock(slide, slideNo, data.title, data.subtitle, 64, 86, 820);
  addBulletPanel(slide, slideNo, 64, 224, 552, 348, "Next 3-6 months", [
    "Revise sizing guides, fit notes, and product copy to reduce avoidable confusion before purchase.",
    "Upgrade product photography and color descriptions so online expectations better match the item received.",
    "Create a simple post-purchase feedback loop that flags repeat complaints for immediate review by merchandising and support.",
  ], { accent: ACCENT, role: "short term recommendations" });
  addBulletPanel(slide, slideNo, 664, 224, 552, 348, "Next 6-12 months", [
    "Standardize sizing logic across collections and validate it with broader fit testing.",
    "Expand fit coverage across body types, including petite and plus sizing where demand is visible.",
    "Evaluate virtual fit or richer personalization tools to reduce returns and increase purchase confidence.",
  ], { accent: GOLD, role: "long term recommendations" });
  addNarrativePanel(
    slide,
    slideNo,
    64,
    588,
    1152,
    116,
    "Expected business impact",
    "The pipeline can help ChicStyle spot pain points faster, improve product pages, prioritize fixes with evidence, and reduce avoidable dissatisfaction before it turns into returns or churn.",
    { accent: CORAL, size: 18, role: "business impact panel" },
  );
  addNotes(slide, data.notes, data.sources);
}

async function slideConclusion(presentation) {
  const slideNo = 9;
  const data = SLIDES[8];
  const slide = presentation.slides.add();
  await addPlate(slide, slideNo);
  addHeader(slide, slideNo, data.kicker, slideNo, SLIDES.length);
  addTitleBlock(slide, slideNo, data.title, data.subtitle, 64, 86, 820);
  addSummaryCard(slide, slideNo, 64, 232, 360, 176, "Adopt now", "Use Zero-Shot V1 as the default production prompt because it is the highest-scoring and simplest design to maintain.", ACCENT);
  addSummaryCard(slide, slideNo, 460, 232, 360, 176, "Escalate smartly", "Use CoT V2 for edge cases where the review is mixed, complex, or likely to benefit from more structured reasoning.", GOLD);
  addSummaryCard(slide, slideNo, 856, 232, 360, 176, "Pilot next", "Run a larger fixed-sample pilot and pair it with a small human-reviewed benchmark before wider rollout.", CORAL);
  addNarrativePanel(
    slide,
    slideNo,
    64,
    454,
    1152,
    164,
    "Limitations and next step",
    "The final prompt comparison used a 50-review sample to stay within API budget, and the LLM-as-Judge adds some evaluation subjectivity. The next step is to validate the same workflow on a larger fixed sample, keep averaging across repeated runs, and add human review for the highest-impact use cases.",
    { accent: SKY, size: 18, role: "limitations panel" },
  );
  addText(slide, slideNo, "Recommended decision: pilot the workflow using Zero-Shot V1 as the baseline prompt.", 64, 646, 860, 24, {
    size: 14,
    color: ACCENT_DARK,
    bold: true,
    face: BODY_FACE,
    checkFit: false,
    role: "closing decision line",
  });
  addNotes(slide, data.notes, data.sources);
}

async function createDeck() {
  await ensureDirs();
  if (!SLIDES.length) {
    throw new Error("SLIDES must contain at least one slide.");
  }
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  await slideCover(presentation);
  await slideBusinessProblem(presentation);
  await slideWorkflow(presentation);
  await slideEda(presentation);
  await slidePromptResults(presentation);
  await slideRecommendationSignal(presentation);
  await slideThemes(presentation);
  await slideRecommendations(presentation);
  await slideConclusion(presentation);
  return presentation;
}

async function saveBlobToFile(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function writeInspectArtifact(presentation) {
  inspectRecords.unshift({
    kind: "deck",
    id: DECK_ID,
    slideCount: presentation.slides.count,
    slideSize: { width: W, height: H },
  });
  presentation.slides.items.forEach((slide, index) => {
    inspectRecords.splice(index + 1, 0, {
      kind: "slide",
      slide: index + 1,
      id: slide?.id || `slide-${index + 1}`,
    });
  });
  const lines = inspectRecords.map((record) => JSON.stringify(record)).join("\n") + "\n";
  await fs.writeFile(INSPECT_PATH, lines, "utf8");
}

async function currentRenderLoopCount() {
  const logPath = path.join(VERIFICATION_DIR, "render_verify_loops.ndjson");
  if (!(await pathExists(logPath))) return 0;
  const previous = await fs.readFile(logPath, "utf8");
  return previous.split(/\r?\n/).filter((line) => line.trim()).length;
}

async function nextRenderLoopNumber() {
  return (await currentRenderLoopCount()) + 1;
}

async function appendRenderVerifyLoop(presentation, previewPaths, pptxPath) {
  const logPath = path.join(VERIFICATION_DIR, "render_verify_loops.ndjson");
  const priorCount = await currentRenderLoopCount();
  const record = {
    kind: "render_verify_loop",
    deckId: DECK_ID,
    loop: priorCount + 1,
    maxLoops: MAX_RENDER_VERIFY_LOOPS,
    capReached: priorCount + 1 >= MAX_RENDER_VERIFY_LOOPS,
    timestamp: new Date().toISOString(),
    slideCount: presentation.slides.count,
    previewCount: previewPaths.length,
    previewDir: PREVIEW_DIR,
    inspectPath: INSPECT_PATH,
    pptxPath,
  };
  await fs.appendFile(logPath, JSON.stringify(record) + "\n", "utf8");
  return record;
}

async function verifyAndExport(presentation) {
  await ensureDirs();
  const nextLoop = await nextRenderLoopNumber();
  if (nextLoop > MAX_RENDER_VERIFY_LOOPS) {
    throw new Error(
      `Render/verify/fix loop cap reached: ${MAX_RENDER_VERIFY_LOOPS} total renders are allowed. ` +
        "Do not rerender; note any remaining visual issues in the final response.",
    );
  }
  await writeInspectArtifact(presentation);
  const previewPaths = [];
  for (let idx = 0; idx < presentation.slides.items.length; idx += 1) {
    const slide = presentation.slides.items[idx];
    const preview = await presentation.export({ slide, format: "png", scale: 1 });
    const previewPath = path.join(PREVIEW_DIR, `slide-${String(idx + 1).padStart(2, "0")}.png`);
    await saveBlobToFile(preview, previewPath);
    previewPaths.push(previewPath);
  }
  const pptxBlob = await PresentationFile.exportPptx(presentation);
  const pptxPath = path.join(OUT_DIR, "output.pptx");
  await pptxBlob.save(pptxPath);
  const loopRecord = await appendRenderVerifyLoop(presentation, previewPaths, pptxPath);
  return { pptxPath, loopRecord };
}

const presentation = await createDeck();
const result = await verifyAndExport(presentation);
console.log(result.pptxPath);
